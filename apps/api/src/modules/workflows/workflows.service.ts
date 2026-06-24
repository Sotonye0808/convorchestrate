import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Workflow } from "../../entities/workflow.entity";

@Injectable()
export class WorkflowsService {
    constructor(
        @InjectRepository(Workflow)
        private readonly workflowRepo: Repository<Workflow>,
    ) { }

    async findAll(tenantId: string): Promise<Workflow[]> {
        return this.workflowRepo.find({
            where: { tenantId },
            order: { createdAt: "DESC" },
        });
    }

    async findById(id: string): Promise<Workflow> {
        const workflow = await this.workflowRepo.findOne({ where: { id } });
        if (!workflow) {
            throw new NotFoundException("workflow_not_found");
        }
        return workflow;
    }

    async update(id: string, data: Partial<Pick<Workflow, "name" | "config" | "isActive">>): Promise<Workflow> {
        const workflow = await this.workflowRepo.findOne({ where: { id } });
        if (!workflow) {
            throw new NotFoundException("workflow_not_found");
        }
        Object.assign(workflow, data);
        return this.workflowRepo.save(workflow);
    }

    async create(data: {
        tenantId: string;
        workflowId: string;
        name: string;
        type: string;
        config: Record<string, unknown>;
    }): Promise<Workflow> {
        const workflow = this.workflowRepo.create({
            tenantId: data.tenantId,
            workflowId: data.workflowId,
            name: data.name,
            type: data.type,
            config: data.config,
            version: 1,
            isActive: true,
        });
        return this.workflowRepo.save(workflow);
    }
}
