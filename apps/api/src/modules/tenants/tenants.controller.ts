import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@Controller("tenants")
@UseGuards(JwtAuthGuard)
export class TenantsController {
    constructor(private readonly tenantsService: TenantsService) { }

    @Get()
    async findAll() {
        return this.tenantsService.findAll();
    }

    @Get(":id")
    async findOne(@Param("id") id: string) {
        return this.tenantsService.findOne(id);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() body: {
        name: string;
        slug: string;
        phoneNumberId?: string;
        accessToken?: string;
        appSecret?: string;
        appId?: string;
        wabaId?: string;
    }) {
        return this.tenantsService.create(body);
    }

    @Put(":id")
    async update(@Param("id") id: string, @Body() body: any) {
        return this.tenantsService.update(id, body);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async delete(@Param("id") id: string) {
        await this.tenantsService.delete(id);
    }
}
