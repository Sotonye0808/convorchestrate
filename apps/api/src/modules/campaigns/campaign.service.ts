import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { WorkflowConfig } from "@convorchestrate/schemas";
import { Campaign } from "../../entities/campaign.entity";
import { Contact } from "../../entities/contact.entity";
import { Session } from "../../entities/session.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Tenant } from "../../entities/tenant.entity";
import { QueueService } from "../queue/queue.service";
import { randomUUID } from "crypto";

@Injectable()
export class CampaignService {
    private readonly logger = new Logger(CampaignService.name);

    constructor(
        @InjectRepository(Campaign)
        private readonly campaignRepo: Repository<Campaign>,
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
        @InjectRepository(Workflow)
        private readonly workflowRepo: Repository<Workflow>,
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
        private readonly queueService: QueueService,
    ) { }

    async create(data: {
        tenantId: string;
        name: string;
        workflowId: string;
        contactList: string[];
    }): Promise<Campaign> {
        const campaign = this.campaignRepo.create({
            tenantId: data.tenantId,
            name: data.name,
            workflowId: data.workflowId,
            contactList: data.contactList,
            totalCount: data.contactList.length,
            sentCount: 0,
            failedCount: 0,
            status: "draft",
        });
        return this.campaignRepo.save(campaign);
    }

    async findAll(tenantId: string): Promise<Campaign[]> {
        return this.campaignRepo.find({
            where: { tenantId },
            order: { createdAt: "DESC" },
        });
    }

    async findById(tenantId: string, id: string): Promise<Campaign | null> {
        return this.campaignRepo.findOne({
            where: { tenantId, id },
        });
    }

    async launch(tenantId: string, campaignId: string): Promise<void> {
        const campaign = await this.campaignRepo.findOne({
            where: { tenantId, id: campaignId },
        });
        if (!campaign) {
            throw new Error(`campaign_not_found: ${campaignId}`);
        }
        if (campaign.status !== "draft") {
            throw new Error(`campaign_invalid_status: ${campaign.status}`);
        }

        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        if (!tenant) {
            throw new Error(`tenant_not_found: ${tenantId}`);
        }

        const workflowEntity = await this.workflowRepo.findOne({
            where: { tenantId, workflowId: campaign.workflowId, isActive: true },
            order: { version: "DESC" },
        });
        if (!workflowEntity) {
            throw new Error(`workflow_not_found: ${campaign.workflowId}`);
        }

        const tenantConfig = (tenant.config ?? {}) as Record<string, unknown>;
        const maxSendsPerMinute = (tenantConfig.campaign_max_sends_per_minute as number) ?? 20;

        campaign.status = "launching";
        campaign.startedAt = new Date();
        await this.campaignRepo.save(campaign);

        const config = workflowEntity.config as unknown as WorkflowConfig;

        for (const phone of campaign.contactList) {
            try {
                let contact = await this.contactRepo.findOne({
                    where: { tenantId, phone },
                });
                if (!contact) {
                    contact = this.contactRepo.create({
                        tenantId,
                        phone,
                        metadata: {},
                    });
                    contact = await this.contactRepo.save(contact);
                }

                const existingSession = await this.sessionRepo.findOne({
                    where: { tenantId, contactId: contact.id, status: "active" },
                    order: { startedAt: "DESC" },
                });

                let sessionId: string;
                if (existingSession) {
                    sessionId = existingSession.id;
                } else {
                    const newSession = this.sessionRepo.create({
                        tenantId,
                        workflowId: workflowEntity.id,
                        contactId: contact.id,
                        status: "active",
                        context: {},
                        state: {},
                    });
                    const saved = await this.sessionRepo.save(newSession);
                    sessionId = saved.id;
                }

                await this.queueService.workflowQueue.add(
                    "process",
                    {
                        config,
                        ctx: {
                            tenantId,
                            contactId: contact.id,
                            sessionId,
                            traceId: randomUUID(),
                            trigger: "campaign_start",
                        },
                    },
                    {
                        attempts: 3,
                        backoff: { type: "exponential", delay: 2000 },
                    },
                );

                campaign.sentCount += 1;
                await this.campaignRepo.save(campaign);

                const delayMs = Math.ceil(60000 / maxSendsPerMinute);
                if (delayMs > 0) {
                    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
                }
            } catch (error) {
                campaign.failedCount += 1;
                await this.campaignRepo.save(campaign);
                this.logger.error("campaign_contact_failed", {
                    campaignId,
                    phone,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }

        campaign.status = "completed";
        campaign.completedAt = new Date();
        await this.campaignRepo.save(campaign);
    }
}
