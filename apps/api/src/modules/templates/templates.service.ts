import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MetaApiClient } from "@convorchestrate/meta-api";
import { WATemplate } from "../../entities/wa-template.entity";

@Injectable()
export class TemplatesService {
    private readonly logger = new Logger(TemplatesService.name);

    constructor(
        @InjectRepository(WATemplate)
        private readonly templateRepo: Repository<WATemplate>,
        private readonly metaApiClient: MetaApiClient,
    ) { }

    async findAll(tenantId: string): Promise<WATemplate[]> {
        return this.templateRepo.find({ where: { tenantId }, order: { createdAt: "DESC" } });
    }

    async findOne(tenantId: string, id: string): Promise<WATemplate> {
        const t = await this.templateRepo.findOne({ where: { id, tenantId } });
        if (!t) throw new NotFoundException("template not found");
        return t;
    }

    async create(tenantId: string, data: {
        name: string;
        language: string;
        category: string;
        components: Record<string, unknown>[];
        submitNow?: boolean;
    }): Promise<WATemplate> {
        const t = this.templateRepo.create({
            tenantId,
            name: data.name,
            language: data.language,
            category: data.category,
            components: data.components,
            metaStatus: "draft",
        });

        if (data.submitNow) {
            const wabaId = process.env.META_WABA_ID;
            if (!wabaId) {
                throw new Error("META_WABA_ID not configured");
            }
            try {
                const metaId = await this.metaApiClient.submitTemplate(
                    wabaId, data.name, data.language,
                    data.category as any, data.components as any,
                );
                t.metaId = metaId;
                t.metaStatus = "pending";
            } catch (err) {
                this.logger.error("meta_submit_failed", { error: String(err) });
                throw new Error(`Meta submission failed: ${err instanceof Error ? err.message : String(err)}`);
            }
        }

        return this.templateRepo.save(t);
    }

    async submitToMeta(tenantId: string, id: string): Promise<WATemplate> {
        const t = await this.findOne(tenantId, id);
        const wabaId = process.env.META_WABA_ID;
        if (!wabaId) throw new Error("META_WABA_ID not configured");

        const metaId = await this.metaApiClient.submitTemplate(
            wabaId, t.name, t.language,
            t.category as any, t.components as any,
        );
        t.metaId = metaId;
        t.metaStatus = "pending";
        return this.templateRepo.save(t);
    }

    async syncFromMeta(tenantId: string, id: string): Promise<WATemplate> {
        const t = await this.findOne(tenantId, id);
        const wabaId = process.env.META_WABA_ID;
        if (!wabaId) throw new Error("META_WABA_ID not configured");

        const all = await this.metaApiClient.listTemplates(wabaId);
        const match = all.find((m) => m.name === t.name);
        if (match) {
            t.metaStatus = match.status;
            if (match.rejected_reason) {
                t.rejectReason = match.rejected_reason;
            }
            if (match.id) {
                t.metaId = match.id;
            }
            return this.templateRepo.save(t);
        }
        return t;
    }

    async uploadImage(imageUrl: string): Promise<string> {
        return this.metaApiClient.uploadMedia(imageUrl);
    }

    async delete(tenantId: string, id: string): Promise<void> {
        await this.templateRepo.delete({ id, tenantId });
    }
}
