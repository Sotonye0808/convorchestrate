import { Controller, Get, Param, Query, BadRequestException, NotFoundException } from "@nestjs/common";
import { EventsService } from "./events.service";

@Controller("events")
export class EventsController {
    constructor(private readonly eventsService: EventsService) { }

    @Get()
    async findAll(
        @Query("tenantId") tenantId?: string,
        @Query("contactId") contactId?: string,
        @Query("sessionId") sessionId?: string,
        @Query("traceId") traceId?: string,
        @Query("eventType") eventType?: string,
        @Query("startDate") startDate?: string,
        @Query("endDate") endDate?: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.eventsService.findAll(
            tenantId,
            { contactId, sessionId, traceId, eventType, startDate, endDate },
            page ? Number(page) : 1,
            limit ? Number(limit) : 50,
        );
    }

    @Get("replay/:traceId")
    async replay(
        @Param("traceId") traceId: string,
        @Query("tenantId") tenantId?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        const events = await this.eventsService.findByTraceId(tenantId, traceId);
        if (events.length === 0) {
            throw new NotFoundException("trace_not_found");
        }
        return { traceId, events };
    }
}
