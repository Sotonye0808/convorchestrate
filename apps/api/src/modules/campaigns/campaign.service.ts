import { Injectable, Logger, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MetaApiClient } from "@convorchestrate/meta-api";
import type { EngineContext } from "@convorchestrate/core";
import { Campaign } from "../../entities/campaign.entity";
import { CampaignMessage } from "../../entities/campaign-message.entity";
import { WATemplate } from "../../entities/wa-template.entity";
import { ContactGroup } from "../../entities/contact-group.entity";
import { Workflow } from "../../entities/workflow.entity";
import { EngineService } from "../engine/engine.service";
import { randomUUID } from "crypto";

@Injectable()
export class CampaignService {
    private readonly logger = new Logger(CampaignService.name);

    constructor(
        @InjectRepository(Campaign)
        private readonly campaignRepo: Repository<Campaign>,
        @InjectRepository(CampaignMessage)
        private readonly campaignMessageRepo: Repository<CampaignMessage>,
        @InjectRepository(WATemplate)
        private readonly templateRepo: Repository<WATemplate>,
        @InjectRepository(ContactGroup)
        private readonly groupRepo: Repository<ContactGroup>,
        @InjectRepository(Workflow)
        private readonly workflowRepo: Repository<Workflow>,
        private readonly metaApiClient: MetaApiClient,
        private readonly engineService: EngineService,
    ) { }

    async findAll(tenantId: string): Promise<Campaign[]> {
        return this.campaignRepo.find({
            where: { tenantId },
            relations: ["template", "group"],
            order: { createdAt: "DESC" },
        });
    }

    async findOne(tenantId: string, id: string): Promise<Campaign> {
        const c = await this.campaignRepo.findOne({
            where: { id, tenantId },
            relations: ["template", "group", "messages", "messages.contact"],
        });
        if (!c) throw new NotFoundException("campaign not found");
        return c;
    }

    async create(tenantId: string, data: {
        name: string;
        templateId: string;
        groupId: string;
        imageUrl?: string;
        workflowId?: string;
    }): Promise<Campaign> {
        const template = await this.templateRepo.findOne({ where: { id: data.templateId, tenantId } });
        if (!template) throw new NotFoundException("template not found");

        const group = await this.groupRepo.findOne({ where: { id: data.groupId, tenantId } });
        if (!group) throw new NotFoundException("group not found");

        if (data.workflowId) {
            const workflow = await this.workflowRepo.findOne({ where: { id: data.workflowId, tenantId } });
            if (!workflow) throw new NotFoundException("workflow not found");
        }

        const campaign = this.campaignRepo.create({
            tenantId,
            name: data.name,
            templateId: data.templateId,
            groupId: data.groupId,
            imageUrl: data.imageUrl ?? null,
            workflowId: data.workflowId ?? null,
            status: "draft",
        });
        return this.campaignRepo.save(campaign);
    }

    async send(tenantId: string, id: string): Promise<{ message: string; contacts: number }> {
        const campaign = await this.campaignRepo.findOne({
            where: { id, tenantId },
            relations: ["template", "group", "group.contacts", "workflow"],
        });
        if (!campaign) throw new NotFoundException("campaign not found");
        if (campaign.status === "sending") {
            throw new ConflictException("campaign is already sending");
        }

        const contacts = campaign.group?.contacts ?? [];
        if (contacts.length === 0) {
            await this.campaignRepo.update(id, { status: "completed" });
            return { message: "no contacts in group", contacts: 0 };
        }

        const now = new Date();
        await this.campaignRepo.update(id, { status: "sending", startedAt: now });

        const messages = contacts.map((ct) =>
            this.campaignMessageRepo.create({
                campaignId: id,
                tenantId,
                contactId: ct.id,
                phone: ct.phone,
                status: "pending",
            }),
        );
        await this.campaignMessageRepo.save(messages);

        const concurrency = 5;
        const sem = new Semaphore(concurrency);
        let sent = 0;
        let failed = 0;

        const isWorkflowMode = !!campaign.workflowId && !!campaign.workflow;

        const sendPromises = contacts.map(async (ct, i) => {
            await sem.acquire();
            try {
                const msgId = messages[i].id;
                if (isWorkflowMode) {
                    const config = campaign.workflow!.config as unknown as Parameters<typeof this.engineService.process>[0];
                    const ctx: EngineContext = {
                        tenantId,
                        contactId: ct.id,
                        sessionId: randomUUID(),
                        traceId: randomUUID(),
                        trigger: "campaign_start",
                    };
                    await this.engineService.process(config, ctx);
                    await this.campaignMessageRepo.update(msgId, {
                        status: "sent",
                        sentAt: new Date(),
                    });
                } else {
                    const phone = "+" + ct.phone;
                    const wamid = await this.metaApiClient.sendTemplate(
                        phone,
                        campaign.template!.name,
                        campaign.template!.language,
                        undefined,
                    );
                    await this.campaignMessageRepo.update(msgId, {
                        status: "sent",
                        waMessageId: wamid,
                        sentAt: new Date(),
                    });
                }
                sent++;
            } catch (err) {
                failed++;
                const errMsg = err instanceof Error ? err.message : String(err);
                this.logger.error("campaign_send_failed", { contact: ct.phone, error: errMsg });
                await this.campaignMessageRepo.update(messages[i].id, {
                    status: "failed",
                    failReason: errMsg,
                });
            } finally {
                sem.release();
            }
        });

        await Promise.all(sendPromises);

        const finalStatus = failed > 0 ? (sent > 0 ? "partial_failed" : "failed") : "completed";
        await this.campaignRepo.update(id, {
            status: finalStatus,
            sentCount: sent,
            failCount: failed,
            completedAt: new Date(),
        });

        this.logger.log("campaign_completed", { id, sent, failed });
        return { message: "campaign completed", contacts: contacts.length };
    }

    async getMessages(tenantId: string, id: string): Promise<CampaignMessage[]> {
        return this.campaignMessageRepo.find({
            where: { campaignId: id, tenantId },
            relations: ["contact"],
            order: { createdAt: "ASC" },
        });
    }

    async delete(tenantId: string, id: string): Promise<void> {
        await this.campaignMessageRepo.delete({ campaignId: id, tenantId });
        await this.campaignRepo.delete({ id, tenantId });
    }
}

class Semaphore {
    private queue: (() => void)[] = [];
    private available: number;

    constructor(concurrency: number) {
        this.available = concurrency;
    }

    async acquire(): Promise<void> {
        if (this.available > 0) {
            this.available--;
            return;
        }
        return new Promise<void>((resolve) => {
            this.queue.push(resolve);
        });
    }

    release(): void {
        const next = this.queue.shift();
        if (next) {
            next();
        } else {
            this.available++;
        }
    }
}
