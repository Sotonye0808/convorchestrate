import { Controller, Get, Param, Query, BadRequestException } from "@nestjs/common";
import { ContactsService } from "./contacts.service";

@Controller("contacts")
export class ContactsController {
    constructor(private readonly contactsService: ContactsService) { }

    @Get()
    async findAll(
        @Query("tenantId") tenantId?: string,
        @Query("search") search?: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.contactsService.findAll(
            tenantId,
            search,
            page ? Number(page) : 1,
            limit ? Number(limit) : 20,
        );
    }

    @Get(":id")
    async findById(
        @Param("id") id: string,
        @Query("tenantId") tenantId?: string,
    ) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.contactsService.findById(tenantId, id);
    }
}
