import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Session } from "../../entities/session.entity";
import { Contact } from "../../entities/contact.entity";
import { ContactTag } from "../../entities/contact-tag.entity";
import { Campaign } from "../../entities/campaign.entity";

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(ContactTag)
        private readonly contactTagRepo: Repository<ContactTag>,
        @InjectRepository(Campaign)
        private readonly campaignRepo: Repository<Campaign>,
    ) { }

    async getStats(tenantId: string) {
        const [activeSessions, totalContacts, verifiedContacts, activeCampaigns] =
            await Promise.all([
                this.sessionRepo.count({ where: { tenantId, status: "active" } }),
                this.contactRepo.count({ where: { tenantId } }),
                this.contactTagRepo.count({
                    where: { tenantId, tag: "verified" },
                }),
                this.campaignRepo.count({
                    where: { tenantId, status: "active" },
                }),
            ]);

        return { activeSessions, totalContacts, verifiedContacts, activeCampaigns };
    }
}
