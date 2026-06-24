import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { SessionsService } from "./sessions.service";

@Controller("sessions")
export class SessionsController {
    constructor(private readonly sessionsService: SessionsService) { }

    @Get()
    async findAll(
        @Query("tenantId") tenantId?: string,
        @Query("contactId") contactId?: string,
        @Query("status") status?: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.sessionsService.findAll(
            tenantId,
            { contactId, status },
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
        );
    }
}
