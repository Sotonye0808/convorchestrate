import { Controller, Get, Put, Post, Param, Body, Query, BadRequestException, HttpCode, HttpStatus } from "@nestjs/common";
import { WorkflowsService } from "./workflows.service";

@Controller("workflows")
export class WorkflowsController {
    constructor(private readonly workflowsService: WorkflowsService) { }

    @Get()
    async findAll(@Query("tenantId") tenantId?: string) {
        if (!tenantId) {
            throw new BadRequestException("tenantId is required");
        }
        return this.workflowsService.findAll(tenantId);
    }

    @Get(":id")
    async findById(@Param("id") id: string) {
        return this.workflowsService.findById(id);
    }

    @Put(":id")
    async update(
        @Param("id") id: string,
        @Body() body: Partial<{ name: string; config: Record<string, unknown>; isActive: boolean }>,
    ) {
        return this.workflowsService.update(id, body);
    }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(
        @Body() body: {
            tenantId: string;
            workflowId: string;
            name: string;
            type: string;
            config: Record<string, unknown>;
        },
    ) {
        if (!body.tenantId || !body.workflowId || !body.name || !body.type) {
            throw new BadRequestException("tenantId, workflowId, name, and type are required");
        }
        return this.workflowsService.create(body);
    }
}
