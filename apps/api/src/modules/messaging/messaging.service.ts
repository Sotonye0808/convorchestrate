import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { WwjsAdapter } from "@convorchestrate/adapters";
import type { ChannelAdapter, IncomingRawMessage } from "@convorchestrate/adapters";
import type { WorkflowEngine, MediationContext } from "@convorchestrate/core";
import type { WorkflowConfig, RelayRule } from "@convorchestrate/schemas";
import { Tenant } from "../../entities/tenant.entity";
import { Contact } from "../../entities/contact.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Session } from "../../entities/session.entity";
import { MediationSession } from "../../entities/mediation-session.entity";
import { normalizeMessage } from "./message-normalizer";
import { EngineService } from "../engine/engine.service";
import { QueueService, WorkflowExecutionJob } from "../queue/queue.service";
import { DelayedMessageProcessor } from "../queue/delayed-message.processor";
import { randomUUID } from "crypto";

@Injectable()
export class MessagingService implements OnModuleInit {
    private readonly logger = new Logger(MessagingService.name);

    constructor(
        private readonly engineService: EngineService,
        private readonly adapter: WwjsAdapter,
        private readonly configService: ConfigService,
        private readonly queueService: QueueService,
        private readonly delayedMessageProcessor: DelayedMessageProcessor,
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(Workflow)
        private readonly workflowRepo: Repository<Workflow>,
        @InjectRepository(Session)
        private readonly sessionRepo: Repository<Session>,
        @InjectRepository(MediationSession)
        private readonly mediationSessionRepo: Repository<MediationSession>,
    ) { }

    async onModuleInit(): Promise<void> {
        const sessionDataPath = this.configService.get<string>("WA_SESSION_DATA_PATH") ?? "./wa-sessions";

        this.adapter.onMessage((raw: IncomingRawMessage) => {
            this.handleIncoming(raw).catch((err) => {
                this.logger.error("incoming_message_failed", err instanceof Error ? err.message : String(err));
            });
        });

        this.engineService.setAdapter(this.adapter);
        this.delayedMessageProcessor.setAdapter(this.adapter);

        this.queueService.setWorkflowHandler((job) => {
            return this.engineService.process(job.config, job.ctx);
        });

        await this.adapter.initialize("default", {
            sessionDataPath,
            rateLimitMs: 1200,
            jitterMs: 1500,
        });

        this.logger.log("WhatsApp adapter initialized and wired");
    }

    async handleIncoming(raw: IncomingRawMessage): Promise<void> {
        const phone = raw.from.replace(/@[a-z.]+$/g, "");
        const tenant = await this.tenantRepo.findOne({ where: { isActive: true } });
        if (!tenant) {
            this.logger.warn("no_active_tenant");
            return;
        }

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
            this.logger.warn("no_active_workflow", { tenantId: tenant.id });
            return;
        }

        const config = workflowEntity.config as unknown as WorkflowConfig;

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

        let mediationContext: MediationContext | undefined;

        if (config.type === "mediation") {
            const relayRules = config.relay_rules ?? [];
            const parties = config.parties ?? [];
            const contactRole = await this.resolveMediationParty(
                tenant.id, contact.id, sessionId, workflowEntity.id, relayRules,
            );

            if (contactRole) {
                const otherParty = parties.find((p) => p.role !== contactRole.role);
                const relayRule = relayRules.find(
                    (r) => r.from_party === contactRole.role,
                );

                mediationContext = {
                    sessionId,
                    fromParty: contactRole.role,
                    toParty: otherParty?.role ?? "",
                    parties: Object.fromEntries(parties.map((p) => [p.role, p.label])),
                    relayTransform: relayRule?.transform,
                };
            }
        }

        const ctx = {
            tenantId: tenant.id,
            contactId: contact.id,
            sessionId,
            traceId: randomUUID(),
            incomingMessage: normalizeMessage(raw),
            mediationContext,
        };

        await this.queueService.workflowQueue.add(
            "process",
            { config, ctx } satisfies WorkflowExecutionJob,
        );
    }

    private async resolveMediationParty(
        tenantId: string,
        contactId: string,
        sessionId: string,
        workflowId: string,
        relayRules: RelayRule[],
    ): Promise<{ role: string } | null> {
        const existing = await this.mediationSessionRepo.findOne({
            where: [
                { tenantId, partyAContactId: contactId, status: "active" },
                { tenantId, partyBContactId: contactId, status: "active" },
            ],
        });
        if (existing) {
            const role = existing.partyAContactId === contactId
                ? existing.partyARole
                : existing.partyBRole;
            return { role };
        }

        const openSlot = await this.mediationSessionRepo.findOne({
            where: { tenantId, status: "active" },
            order: { createdAt: "DESC" },
        });
        if (openSlot && !openSlot.partyBContactId) {
            const partyBRole = relayRules.find((r) => r.from_party !== openSlot.partyARole)?.from_party ?? "seller";
            openSlot.partyBContactId = contactId;
            openSlot.partyBRole = partyBRole;
            await this.mediationSessionRepo.save(openSlot);
            return { role: partyBRole };
        }

        const partyA = relayRules.length > 0 ? relayRules[0].from_party : "buyer";
        const newMediation = this.mediationSessionRepo.create({
            tenantId,
            workflowId,
            sessionId,
            partyAContactId: contactId,
            partyBContactId: null,
            partyARole: partyA,
            partyBRole: relayRules.length > 1 ? relayRules[1].from_party : "seller",
            context: {},
            status: "active",
        });
        await this.mediationSessionRepo.save(newMediation);
        return { role: partyA };
    }
}
