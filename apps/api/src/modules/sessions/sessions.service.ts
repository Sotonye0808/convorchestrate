import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Session } from "../../entities/session.entity";

interface SessionFilters {
    contactId?: string;
    status?: string;
}

@Injectable()
export class SessionsService {
    constructor(
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
    ) { }

    async findAll(
        tenantId: string,
        filters?: SessionFilters,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ data: Session[]; total: number; page: number; limit: number }> {
        const where: any = { tenantId };

        if (filters?.contactId) {
            where.contactId = filters.contactId;
        }
        if (filters?.status) {
            where.status = filters.status;
        }

        const [data, total] = await this.sessionRepo.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { startedAt: "DESC" },
        });

        return { data, total, page, limit };
    }
}
