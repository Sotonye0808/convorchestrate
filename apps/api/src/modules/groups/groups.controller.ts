import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Logger, UseGuards } from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentTenant } from "../../common/decorators/current-tenant.decorator";

@Controller("groups")
@UseGuards(JwtAuthGuard)
export class GroupsController {
    private readonly logger = new Logger(GroupsController.name);

    constructor(private readonly groupsService: GroupsService) { }

    @Get()
    async findAll(@CurrentTenant() tenantId: string) {
        return this.groupsService.findAll(tenantId);
    }

    @Get(":id")
    async findOne(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        return this.groupsService.findOne(tenantId, id);
    }

    @Post()
    async create(@CurrentTenant() tenantId: string, @Body() body: { name: string }) {
        return this.groupsService.create(tenantId, body.name);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@CurrentTenant() tenantId: string, @Param("id") id: string) {
        await this.groupsService.delete(tenantId, id);
    }

    @Post(":id/contacts")
    async addContact(
        @CurrentTenant() tenantId: string,
        @Param("id") id: string,
        @Body() body: { phone: string; name?: string },
    ) {
        return this.groupsService.addContact(tenantId, id, body.phone, body.name);
    }

    @Delete(":id/contacts/:contactId")
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeContact(@CurrentTenant() tenantId: string, @Param("contactId") contactId: string) {
        await this.groupsService.removeContact(tenantId, contactId);
    }

    @Post(":id/import")
    async importCsv(
        @CurrentTenant() tenantId: string,
        @Param("id") id: string,
        @Body() body: { rows: Array<{ phone: string; name?: string }> },
    ) {
        const imported = await this.groupsService.importCsv(tenantId, id, body.rows);
        return { imported };
    }
}
