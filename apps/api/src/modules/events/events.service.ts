import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThanOrEqual, MoreThanOrEqual, Between } from "typeorm";
import { EventLog } from "../../entities/event-log.entity";

interface EventFilters {
    contactId?: string;
    sessionId?: string;
    traceId?: string;
    eventType?: string;
    startDate?: string;
    endDate?: string;
}

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(EventLog)
        private readonly eventLogRepo: Repository<EventLog>,
    ) { }

    async findAll(
        tenantId: string,
        filters?: EventFilters,
        page: number = 1,
        limit: number = 50,
    ): Promise<{ data: EventLog[]; total: number; page: number; limit: number }> {
        const where: any = { tenantId };

        if (filters?.contactId) {
            where.contactId = filters.contactId;
        }
        if (filters?.sessionId) {
            where.sessionId = filters.sessionId;
        }
        if (filters?.traceId) {
            where.traceId = filters.traceId;
        }
        if (filters?.eventType) {
            where.eventType = filters.eventType;
        }
        if (filters?.startDate && filters?.endDate) {
            where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
        } else if (filters?.startDate) {
            where.createdAt = MoreThanOrEqual(new Date(filters.startDate));
        } else if (filters?.endDate) {
            where.createdAt = LessThanOrEqual(new Date(filters.endDate));
        }

        const [data, total] = await this.eventLogRepo.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: "DESC" },
        });

        return { data, total, page, limit };
    }

    async findByTraceId(tenantId: string, traceId: string): Promise<EventLog[]> {
        return this.eventLogRepo.find({
            where: { tenantId, traceId },
            order: { createdAt: "ASC" },
        });
    }
}
