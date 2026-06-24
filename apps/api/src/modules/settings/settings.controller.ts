import { Controller, Get, Put, Body, Query, BadRequestException } from "@nestjs/common";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get("tenant")
    async getTenantConfig(@Query("tenantId") tenantId?: string) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.settingsService.getTenantConfig(tenantId);
    }

    @Put("tenant")
    async updateTenantConfig(
        @Body() body: { tenantId: string; config: Record<string, unknown> },
    ) {
        if (!body.tenantId || body.config === undefined) {
            throw new BadRequestException("tenantId and config are required");
        }
        return this.settingsService.updateTenantConfig(body.tenantId, body.config);
    }
}
