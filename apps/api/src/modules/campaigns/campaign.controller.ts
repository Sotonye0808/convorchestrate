import { Controller, Post, Get, Param, Body, HttpCode, HttpStatus, NotFoundException, BadRequestException } from "@nestjs/common";
import { CampaignService } from "./campaign.service";

@Controller("campaigns")
export class CampaignController {
    constructor(private readonly campaignService: CampaignService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() body: {
            tenantId: string;
            name: string;
            workflowId: string;
            contactList: string[];
        },
    ) {
        if (!body.tenantId || !body.name || !body.workflowId || !body.contactList?.length) {
            throw new BadRequestException("tenantId, name, workflowId, and contactList are required");
        }

        const campaign = await this.campaignService.create(body);
        return campaign;
    }

    @Get()
    async findAll(
        @Body("tenantId") tenantId?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.campaignService.findAll(tenantId);
    }

    @Get(":id")
    async findById(
        @Param("id") id: string,
        @Body("tenantId") tenantId?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        const campaign = await this.campaignService.findById(tenantId, id);
        if (!campaign) {
            throw new NotFoundException("campaign_not_found");
        }
        return campaign;
    }

    @Post(":id/launch")
    @HttpCode(HttpStatus.ACCEPTED)
    async launch(
        @Param("id") id: string,
        @Body("tenantId") tenantId?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        await this.campaignService.launch(tenantId, id);
        return { accepted: true, campaignId: id };
    }
}
