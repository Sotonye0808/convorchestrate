import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ContactGroup } from "../../entities/contact-group.entity";
import { Contact } from "../../entities/contact.entity";
import { ContactTag } from "../../entities/contact-tag.entity";

@Injectable()
export class GroupsService {
    private readonly logger = new Logger(GroupsService.name);

    constructor(
        @InjectRepository(ContactGroup)
        private readonly groupRepo: Repository<ContactGroup>,
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(ContactTag)
        private readonly contactTagRepo: Repository<ContactTag>,
    ) { }

    async findAll(tenantId: string): Promise<ContactGroup[]> {
        return this.groupRepo.find({ where: { tenantId }, relations: ["contacts"], order: { createdAt: "DESC" } });
    }

    async findOne(tenantId: string, id: string): Promise<ContactGroup> {
        const g = await this.groupRepo.findOne({ where: { id, tenantId }, relations: ["contacts"] });
        if (!g) throw new NotFoundException("group not found");
        return g;
    }

    async create(tenantId: string, name: string): Promise<ContactGroup> {
        const g = this.groupRepo.create({ tenantId, name });
        return this.groupRepo.save(g);
    }

    async delete(tenantId: string, id: string): Promise<void> {
        const group = await this.groupRepo.findOne({ where: { id, tenantId } });
        if (!group) throw new NotFoundException("group not found");
        await this.contactRepo.update({ groupId: id, tenantId }, { groupId: null });
        await this.groupRepo.delete(id);
    }

    async addContact(tenantId: string, groupId: string, phone: string, name?: string): Promise<Contact> {
        const group = await this.groupRepo.findOne({ where: { id: groupId, tenantId } });
        if (!group) throw new NotFoundException("group not found");

        const c = this.contactRepo.create({
            tenantId,
            groupId,
            phone: phone.replace(/^\+/, ""),
            name,
            metadata: {},
        });
        return this.contactRepo.save(c);
    }

    async removeContact(tenantId: string, contactId: string): Promise<void> {
        await this.contactRepo.delete({ id: contactId, tenantId });
    }

    async importCsv(
        tenantId: string,
        groupId: string,
        rows: Array<{ phone: string; name?: string; tags?: string[] }>,
    ): Promise<number> {
        const group = await this.groupRepo.findOne({ where: { id: groupId, tenantId } });
        if (!group) throw new NotFoundException("group not found");

        const contacts = rows
            .filter((r) => r.phone)
            .map((r) => this.contactRepo.create({
                tenantId,
                groupId,
                phone: r.phone.replace(/^\+/, ""),
                name: r.name ?? null,
                metadata: {},
            }));

        if (contacts.length > 0) {
            const saved = await this.contactRepo.save(contacts);

            const tagEntries: ContactTag[] = [];
            for (let i = 0; i < saved.length; i++) {
                const tags = rows[i]?.tags;
                if (tags && tags.length > 0) {
                    for (const tag of tags) {
                        tagEntries.push(this.contactTagRepo.create({
                            tenantId,
                            contactId: saved[i].id,
                            tag: tag.toLowerCase().trim(),
                        }));
                    }
                }
            }
            if (tagEntries.length > 0) {
                await this.contactTagRepo.save(tagEntries);
            }
        }
        return contacts.length;
    }
}
