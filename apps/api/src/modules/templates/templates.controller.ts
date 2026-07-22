import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Logger, UseGuards } from "@nestjs/common";
import { TemplatesService } from "./templates.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@Controller("templates")
@UseGuards(JwtAuthGuard)
export class TemplatesController {
    private readonly logger = new Logger(TemplatesController.name);

    constructor(private readonly templatesService: TemplatesService) { }

    @Get()
    async findAll(@CurrentTenant() tenantId: string) {
        return this.templatesService.findAll(tenantId);
    }

    @Get(":id")
    async findOne(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.templatesService.findOne(tenantId, id);
    }

    @Post()
    async create(@CurrentTenant() tenantId: string, @Body() body: {
        name: string;
        language: string;
        category: string;
        components: Record<string, unknown>[];
        submitNow?: boolean;
    }) {
        return this.templatesService.create(tenantId, body);
    }

    @Post(":id/submit")
    async submit(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.templatesService.submitToMeta(tenantId, id);
    }

    @Post(":id/sync")
    async sync(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.templatesService.syncFromMeta(tenantId, id);
    }

    @Post("upload-image")
    async uploadImage(@Body() body: { imageUrl: string }) {
        const handle = await this.templatesService.uploadImage(body.imageUrl);
        return { handle };
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        await this.templatesService.delete(tenantId, id);
    }
}
