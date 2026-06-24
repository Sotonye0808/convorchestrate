import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { WorkflowConfig } from "@convorchestrate/schemas";
import { Tenant } from "../../entities/tenant.entity";
import { Contact } from "../../entities/contact.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Session } from "../../entities/session.entity";
import { AdminUser } from "../../entities/admin-user.entity";
import { QueueService } from "../queue/queue.service";
import { normalizeMessage } from "../messaging/message-normalizer";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";

@Injectable()
export class DemoService {
    private readonly logger = new Logger(DemoService.name);

    constructor(
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(Workflow)
        private readonly workflowRepo: Repository<Workflow>,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
        @InjectRepository(AdminUser)
        private readonly adminUserRepo: Repository<AdminUser>,
        private readonly queueService: QueueService,
    ) { }

    async injectMessage(data: {
        tenantId: string;
        phone: string;
        text: string;
        type?: "text" | "image" | "video" | "document" | "audio";
    }): Promise<{ sessionId: string; traceId: string }> {
        const tenant = await this.tenantRepo.findOne({ where: { id: data.tenantId } });
        if (!tenant) {
            throw new Error(`tenant_not_found: ${data.tenantId}`);
        }

        const phone = data.phone.replace(/@[a-z.]+$/g, "");
        let contact = await this.contactRepo.findOne({
            where: { tenantId: tenant.id, phone },
        });
        if (!contact) {
            contact = this.contactRepo.create({
                tenantId: tenant.id,
                phone,
                metadata: {},
            });
            contact = await this.contactRepo.save(contact);
        }

        const workflowEntity = await this.workflowRepo.findOne({
            where: { tenantId: tenant.id, isActive: true },
            order: { version: "DESC" },
        });
        if (!workflowEntity) {
            throw new Error("no_active_workflow");
        }

        const existingSession = await this.sessionRepo.findOne({
            where: { tenantId: tenant.id, contactId: contact.id, status: "active" },
            order: { startedAt: "DESC" },
        });

        let sessionId: string;
        if (existingSession) {
            sessionId = existingSession.id;
        } else {
            const newSession = this.sessionRepo.create({
                tenantId: tenant.id,
                workflowId: workflowEntity.id,
                contactId: contact.id,
                status: "active",
                context: {},
                state: {},
            });
            const saved = await this.sessionRepo.save(newSession);
            sessionId = saved.id;
        }

        const traceId = randomUUID();
        const raw = {
            from: phone,
            body: data.text,
            type: data.type ?? "chat",
            timestamp: Math.floor(Date.now() / 1000),
            raw: {},
        };

        const config = workflowEntity.config as unknown as WorkflowConfig;
        await this.queueService.workflowQueue.add("process", {
            config,
            ctx: {
                tenantId: tenant.id,
                contactId: contact.id,
                sessionId,
                traceId,
                incomingMessage: normalizeMessage(raw as any),
            },
        });

        this.logger.log("demo_message_injected", { traceId, phone, sessionId });
        return { sessionId, traceId };
    }

    async seed(): Promise<{ tenantId: string; adminEmail: string; adminPassword: string }> {
        const adminEmail = "admin@convorchestrate.io";
        const adminPassword = "demo1234";

        const existingTenant = await this.tenantRepo.findOne({ where: { slug: "demo" } });
        if (existingTenant) {
            return {
                tenantId: existingTenant.id,
                adminEmail,
                adminPassword,
            };
        }

        const tenant = this.tenantRepo.create({
            name: "Demo Tenant",
            slug: "demo",
            config: {
                templates: {
                    welcome: "Hello {{name}}! Welcome to Convorchestrate.",
                    awaiting_screenshot: "Please send a screenshot to verify.",
                    deal_confirmed_buyer: "Your deal has been confirmed. Thank you!",
                    deal_confirmed_seller: "The buyer has agreed to the deal. Please proceed.",
                    complete: "Thank you! Your onboarding is complete.",
                },
                campaign_max_sends_per_minute: 20,
                demo_mode: true,
            },
            isActive: true,
        });
        const savedTenant = await this.tenantRepo.save(tenant);

        const workflow = this.workflowRepo.create({
            tenantId: savedTenant.id,
            workflowId: "contact_verification",
            name: "Contact Verification",
            type: "reactive",
            config: {
                workflow_id: "contact_verification",
                name: "Contact Verification",
                type: "reactive",
                timeout_ms: 300000,
                triggers: [{ type: "campaign_start" }],
                handlers: [
                    {
                        event: "message_received",
                        conditions: [{ type: "always" }],
                        actions: [{ type: "send_message", template: "welcome" }],
                    },
                    {
                        event: "message_received",
                        conditions: [{ type: "text_match", value: "done", match: "case_insensitive" }],
                        actions: [
                            { type: "set_context", key: "text_confirmed", value: true },
                            { type: "send_message", template: "awaiting_screenshot" },
                        ],
                    },
                    {
                        event: "message_received",
                        conditions: [
                            { type: "media_received" },
                            { type: "context_equals", field: "text_confirmed", value: true },
                        ],
                        actions: [
                            { type: "tag_user", tag: "verified" },
                            { type: "clear_session" },
                        ],
                    },
                ],
            },
            version: 1,
            isActive: true,
        });
        await this.workflowRepo.save(workflow);

        const hash = await bcrypt.hash(adminPassword, 10);
        const admin = this.adminUserRepo.create({
            email: adminEmail,
            passwordHash: hash,
            role: "admin",
            tenantId: savedTenant.id,
        });
        await this.adminUserRepo.save(admin);

        this.logger.log("demo_data_seeded", { tenantId: savedTenant.id });

        return {
            tenantId: savedTenant.id,
            adminEmail,
            adminPassword,
        };
    }
}
