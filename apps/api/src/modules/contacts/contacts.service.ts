import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like } from "typeorm";
import { Contact } from "../../entities/contact.entity";
import { ContactTag } from "../../entities/contact-tag.entity";

@Injectable()
export class ContactsService {
    constructor(
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(ContactTag)
        private readonly contactTagRepo: Repository<ContactTag>,
    ) { }

    async findAll(
        tenantId: string,
        search?: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ data: Contact[]; total: number; page: number; limit: number }> {
        const where: any = { tenantId };

        if (search) {
            where.phone = Like(`%${search}%`);
        }

        const [contacts, total] = await this.contactRepo.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: "DESC" },
        });

        const data = await Promise.all(
            contacts.map(async (contact) => {
                const tags = await this.contactTagRepo.find({
                    where: { tenantId, contactId: contact.id },
                });
                return { ...contact, tags: tags.map((t) => t.tag) } as Contact & { tags: string[] };
            }),
        );

        return { data, total, page, limit };
    }

    async findById(tenantId: string, id: string): Promise<Contact & { tags: string[] }> {
        const contact = await this.contactRepo.findOne({ where: { tenantId, id } });
        if (!contact) {
            throw new NotFoundException("contact_not_found");
        }
        const tags = await this.contactTagRepo.find({
            where: { tenantId, contactId: contact.id },
        });
        return { ...contact, tags: tags.map((t) => t.tag) };
    }
}
