import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, Delete, Logger, UseGuards } from "@nestjs/common";
import { CampaignService } from "./campaign.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@Controller("campaigns")
@UseGuards(JwtAuthGuard)
export class CampaignController {
    private readonly logger = new Logger(CampaignController.name);

    constructor(private readonly campaignService: CampaignService) { }

    @Get()
    async findAll(@CurrentTenant() tenantId: string) {
        return this.campaignService.findAll(tenantId);
    }

    @Get(":id")
    async findOne(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.campaignService.findOne(tenantId, id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@CurrentTenant() tenantId: string, @Body() body: {
        name: string;
        templateId: string;
        groupId: string;
        imageUrl?: string;
        workflowId?: string;
    }) {
        return this.campaignService.create(tenantId, body);
    }

    @Post(":id/send")
    @HttpCode(HttpStatus.ACCEPTED)
    async send(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.campaignService.send(tenantId, id);
    }

    @Get(":id/messages")
    async getMessages(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.campaignService.getMessages(tenantId, id);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        await this.campaignService.delete(tenantId, id);
    }
}
