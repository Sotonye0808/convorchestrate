import { Controller, Get, Query, BadRequestException } from "@nestjs/common";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get("stats")
    async getStats(@Query("tenantId") tenantId?: string) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.dashboardService.getStats(tenantId);
    }
}
