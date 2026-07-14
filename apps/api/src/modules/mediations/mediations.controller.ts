import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus, Logger, UseGuards } from "@nestjs/common";
import { MediationsService } from "./mediations.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@Controller("mediations")
@UseGuards(JwtAuthGuard)
export class MediationsController {
    private readonly logger = new Logger(MediationsController.name);

    constructor(private readonly mediationsService: MediationsService) { }

    @Get()
    async findAll(
        @CurrentTenant() tenantId: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
    ) {
        return this.mediationsService.findAll(tenantId, page ? Number(page) : 1, limit ? Number(limit) : 20);
    }

    @Get(":id")
    async findOne(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.mediationsService.findOne(tenantId, id);
    }

    @Post(":id/close")
    @HttpCode(HttpStatus.OK)
    async close(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.mediationsService.close(tenantId, id);
    }
}
