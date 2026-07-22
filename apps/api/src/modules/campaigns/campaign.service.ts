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
import { Tenant } from "../../entities/tenant.entity";
import { EngineService } from "../engine/engine.service";
import { QueueService } from "../queue/queue.service";
import { randomUUID } from "crypto";

@Injectable()
export class CampaignService {
    private readonly logger = new Logger(CampaignService.name);

    private readonly rateLimitMap = new Map<string, { count: number; windowStart: number }>();

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
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
        private readonly metaApiClient: MetaApiClient,
        private readonly engineService: EngineService,
        private readonly queueService: QueueService,
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
        scheduledAt?: string;
    }): Promise<Campaign> {
        const template = await this.templateRepo.findOne({ where: { id: data.templateId, tenantId } });
        if (!template) throw new NotFoundException("template not found");

        const group = await this.groupRepo.findOne({ where: { id: data.groupId, tenantId } });
        if (!group) throw new NotFoundException("group not found");

        if (data.workflowId) {
            const workflow = await this.workflowRepo.findOne({ where: { id: data.workflowId, tenantId } });
            if (!workflow) throw new NotFoundException("workflow not found");
        }

        const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

        const campaign = this.campaignRepo.create({
            tenantId,
            name: data.name,
            templateId: data.templateId,
            groupId: data.groupId,
            imageUrl: data.imageUrl ?? null,
            workflowId: data.workflowId ?? null,
            scheduledAt,
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
        if (campaign.status === "scheduled") {
            throw new ConflictException("campaign is already scheduled");
        }

        if (campaign.scheduledAt && campaign.scheduledAt > new Date()) {
            const delay = campaign.scheduledAt.getTime() - Date.now();
            await this.queueService.campaignQueue.add(
                "campaign-launch",
                { campaignId: id, tenantId },
                { delay },
            );
            await this.campaignRepo.update(id, { status: "scheduled" });
            this.logger.log("campaign_scheduled", { id, scheduledAt: campaign.scheduledAt });
            return { message: "campaign scheduled", contacts: 0 };
        }

        return this.executeSend(tenantId, id, campaign);
    }

    private async executeSend(
        tenantId: string,
        id: string,
        campaign: Campaign,
    ): Promise<{ message: string; contacts: number }> {
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

        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        const tenantCreds = tenant?.phoneNumberId && tenant?.accessToken
            ? { phoneNumberId: tenant.phoneNumberId, accessToken: tenant.accessToken }
            : undefined;

        const maxSendsPerMinute = (tenant?.config as Record<string, any>)?.campaign_max_sends_per_minute;
        const rateLimit = typeof maxSendsPerMinute === "number" && maxSendsPerMinute > 0 ? maxSendsPerMinute : 0;

        const sendPromises = contacts.map(async (ct, i) => {
            await sem.acquire();
            try {
                if (rateLimit > 0) {
                    await this.acquireRateLimit(tenantId, rateLimit);
                }

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
                        tenantCreds,
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

    private async acquireRateLimit(tenantId: string, maxPerMinute: number): Promise<void> {
        const now = Date.now();
        const windowMs = 60_000;
        let entry = this.rateLimitMap.get(tenantId);

        if (!entry || now - entry.windowStart >= windowMs) {
            entry = { count: 0, windowStart: now };
            this.rateLimitMap.set(tenantId, entry);
        }

        if (entry.count >= maxPerMinute) {
            const waitMs = windowMs - (now - entry.windowStart);
            if (waitMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, waitMs));
            }
            entry.count = 0;
            entry.windowStart = Date.now();
        }

        entry.count++;
    }

    async getStats(tenantId: string, id: string): Promise<{
        total: number;
        pending: number;
        sent: number;
        delivered: number;
        read: number;
        failed: number;
        sentRate: number;
        deliveryRate: number;
        readRate: number;
    }> {
        const campaign = await this.campaignRepo.findOne({ where: { id, tenantId } });
        if (!campaign) throw new NotFoundException("campaign not found");

        const messages = await this.campaignMessageRepo.find({ where: { campaignId: id, tenantId } });

        const total = messages.length;
        const pending = messages.filter((m) => m.status === "pending").length;
        const sent = messages.filter((m) => m.status === "sent").length;
        const delivered = messages.filter((m) => m.status === "delivered").length;
        const read = messages.filter((m) => m.status === "read").length;
        const failed = messages.filter((m) => m.status === "failed").length;

        const nonPending = total - pending;
        return {
            total,
            pending,
            sent,
            delivered,
            read,
            failed,
            sentRate: nonPending > 0 ? Math.round((sent / nonPending) * 100) : 0,
            deliveryRate: nonPending > 0 ? Math.round((delivered / nonPending) * 100) : 0,
            readRate: nonPending > 0 ? Math.round((read / nonPending) * 100) : 0,
        };
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
