import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MediationSession } from "../../entities/mediation-session.entity";

@Injectable()
export class MediationsService {
    private readonly logger = new Logger(MediationsService.name);

    constructor(
        @InjectRepository(MediationSession)
        private readonly mediationRepo: Repository<MediationSession>,
    ) { }

    async findAll(
        tenantId: string,
        page: number = 1,
        limit: number = 20,
    ): Promise<{ data: MediationSession[]; total: number; page: number; limit: number }> {
        const [data, total] = await this.mediationRepo.findAndCount({
            where: { tenantId } as any,
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: "DESC" },
        });

        return { data, total, page, limit };
    }

    async findOne(tenantId: string, id: string): Promise<MediationSession> {
        const session = await this.mediationRepo.findOne({
            where: { id, tenantId } as any,
        });
        if (!session) throw new NotFoundException("mediation session not found");
        return session;
    }

    async close(tenantId: string, id: string): Promise<MediationSession> {
        const session = await this.findOne(tenantId, id);
        if (session.status !== "active") {
            throw new NotFoundException("mediation session is not active");
        }
        session.status = "closed";
        session.context = { ...session.context, closedAt: new Date().toISOString() };
        return this.mediationRepo.save(session);
    }
}
