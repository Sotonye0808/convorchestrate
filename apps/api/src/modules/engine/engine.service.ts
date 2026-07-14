import { Injectable, Logger } from "@nestjs/common";
import {
    Action,
    WorkflowEngine,
    EngineContext,
    SessionState,
    ActionExecutor,
    InMemoryProvider,
} from "@convorchestrate/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import * as path from "path";
import { writeFile, mkdir } from "fs/promises";
import { Tenant } from "../../entities/tenant.entity";
import { ContactTag } from "../../entities/contact-tag.entity";
import { Media } from "../../entities/media.entity";
import { MediationSession } from "../../entities/mediation-session.entity";
import { Contact } from "../../entities/contact.entity";
import { WATemplate } from "../../entities/wa-template.entity";
import { QueueService, DelayedMessageJob, WebhookTriggerJob } from "../queue/queue.service";

@Injectable()
export class EngineService {
    private readonly logger = new Logger(EngineService.name);
    private readonly engine: WorkflowEngine;
    private sendMessageFn: ((phone: string, text: string) => Promise<string>) | null = null;
    private sendTemplateFn: ((phone: string, templateName: string, language: string, components?: Array<{ type: string; parameters: Array<{ type: string; text: string }> }>, tenantCreds?: { phoneNumberId?: string; accessToken?: string }) => Promise<string>) | null = null;

    constructor(
        private readonly memoryProvider: InMemoryProvider,
        private readonly queueService: QueueService,
        @InjectRepository(Tenant)
        private readonly tenantRepo: Repository<Tenant>,
        @InjectRepository(ContactTag)
        private readonly contactTagRepo: Repository<ContactTag>,
        @InjectRepository(Media)
        private readonly mediaRepo: Repository<Media>,
        @InjectRepository(MediationSession)
        private readonly mediationSessionRepo: Repository<MediationSession>,
        @InjectRepository(Contact)
        private readonly contactRepo: Repository<Contact>,
        @InjectRepository(WATemplate)
        private readonly templateRepo: Repository<WATemplate>,
    ) {
        const executor = this.buildExecutor();
        const engineLogger = {
            error: (message: string, meta?: Record<string, unknown>) => {
                this.logger.error(message, meta);
            },
        };
        this.engine = new WorkflowEngine(this.memoryProvider, executor, engineLogger);
    }

    setSendFunction(fn: (phone: string, text: string) => Promise<string>): void {
        this.sendMessageFn = fn;
    }

    setSendTemplateFunction(fn: (phone: string, templateName: string, language: string, components?: Array<{ type: string; parameters: Array<{ type: string; text: string }> }>, tenantCreds?: { phoneNumberId?: string; accessToken?: string }) => Promise<string>): void {
        this.sendTemplateFn = fn;
    }

    async process(config: Parameters<WorkflowEngine["process"]>[0], ctx: EngineContext): Promise<void> {
        await this.engine.process(config, ctx);

        if (config.type === "mediation" && config.timeout_ms && config.timeout_ms > 0 && ctx.trigger !== "mediation_timeout") {
            const svc = this;
            setTimeout(async () => {
                try {
                    const session = await svc.mediationSessionRepo.findOne({
                        where: { tenantId: ctx.tenantId, sessionId: ctx.sessionId, status: "active" } as any,
                    });
                    if (session && config.on_timeout && config.on_timeout.length > 0) {
                        await svc.engine.process(config, {
                            ...ctx,
                            trigger: "mediation_timeout",
                        });
                    }
                    if (session) {
                        session.status = "timed_out";
                        await svc.mediationSessionRepo.save(session);
                    }
                } catch (error) {
                    svc.logger.error("mediation_timeout_failed", {
                        sessionId: ctx.sessionId,
                        error: error instanceof Error ? error.message : String(error),
                    });
                }
            }, config.timeout_ms);
        }
    }

    private buildExecutor(): ActionExecutor {
        const self = this;

        const executor: ActionExecutor = {
            async execute(action: Action, ctx: EngineContext, state: SessionState): Promise<void> {
                await self.handleAction(action, ctx, state, self);
            },
        };

        return executor;
    }

    private async handleAction(
        action: Action,
        ctx: EngineContext,
        _state: SessionState,
        self: EngineService,
    ): Promise<void> {
        switch (action.type) {
            case "send_message": {
                if (!action.template) {
                    self.logger.warn("send_message_missing_template", { traceId: ctx.traceId });
                    return;
                }

                const tenant = await self.tenantRepo.findOne({
                    where: { id: ctx.tenantId },
                });
                if (!tenant) {
                    self.logger.warn("send_message_tenant_not_found", { traceId: ctx.traceId });
                    return;
                }

                const config = tenant.config as Record<string, unknown>;
                const templates = config?.templates as Record<string, string> | undefined;
                const template = templates?.[action.template];
                if (!template) {
                    self.logger.warn("send_message_template_not_found", {
                        traceId: ctx.traceId,
                        template: action.template,
                    });
                    return;
                }

                if (self.sendMessageFn) {
                    await self.sendMessageFn(ctx.contactId, template);
                } else {
                    self.logger.warn("send_message_no_send_function", { traceId: ctx.traceId });
                }
                return;
            }

            case "send_template_message": {
                if (!action.template) {
                    self.logger.warn("send_template_message_missing_template", { traceId: ctx.traceId });
                    return;
                }
                if (!self.sendTemplateFn) {
                    self.logger.warn("send_template_message_no_send_function", { traceId: ctx.traceId });
                    return;
                }
                const templateEntity = await self.templateRepo.findOne({
                    where: { tenantId: ctx.tenantId, name: action.template },
                });
                if (!templateEntity) {
                    self.logger.warn("send_template_message_not_found", {
                        traceId: ctx.traceId,
                        template: action.template,
                    });
                    return;
                }
                const contact = await self.contactRepo.findOne({
                    where: { id: ctx.contactId, tenantId: ctx.tenantId },
                });
                if (!contact) {
                    self.logger.warn("send_template_message_contact_not_found", {
                        traceId: ctx.traceId,
                        contactId: ctx.contactId,
                    });
                    return;
                }
                const tenant = await self.tenantRepo.findOne({
                    where: { id: ctx.tenantId },
                });
                const tenantCreds = tenant?.phoneNumberId && tenant?.accessToken
                    ? { phoneNumberId: tenant.phoneNumberId, accessToken: tenant.accessToken }
                    : undefined;
                const components = action.template_params && action.template_params.length > 0
                    ? [{ type: "body" as const, parameters: action.template_params.map((p) => ({ type: "text" as const, text: p })) }]
                    : undefined;
                await self.sendTemplateFn(
                    contact.phone,
                    templateEntity.name,
                    templateEntity.language,
                    components,
                    tenantCreds,
                );
                return;
            }

            case "tag_user": {
                if (!action.tag) {
                    self.logger.warn("tag_user_missing_tag", { traceId: ctx.traceId });
                    return;
                }

                await self.contactTagRepo
                    .createQueryBuilder()
                    .insert()
                    .into(ContactTag)
                    .values({
                        tenantId: ctx.tenantId,
                        contactId: ctx.contactId,
                        tag: action.tag,
                        metadata: JSON.parse(JSON.stringify(action.tag_metadata ?? {})),
                    })
                    .orUpdate(["metadata"], ["tenant_id", "contact_id", "tag"])
                    .execute();
                return;
            }

            case "store_media": {
                const uploadPath = process.env.MEDIA_UPLOAD_PATH ?? "./uploads";
                const date = new Date();
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                const dir = path.join(uploadPath, ctx.tenantId, dateStr);
                const ext = ".dat";
                const filename = `${randomUUID()}${ext}`;
                const filePath = path.join(dir, filename);

                if (ctx.incomingMessage?.mediaUrl) {
                    try {
                        const url = ctx.incomingMessage.mediaUrl;
                        const resp = await fetch(url);
                        const buffer = Buffer.from(await resp.arrayBuffer());
                        await mkdir(dir, { recursive: true });
                        await writeFile(filePath, buffer);

                        const media = self.mediaRepo.create({
                            tenantId: ctx.tenantId,
                            contactId: ctx.contactId,
                            sessionId: ctx.sessionId,
                            type: (ctx.incomingMessage.type ?? "UNKNOWN").toUpperCase(),
                            originalFilename: filename,
                            storagePath: filePath,
                            metadata: {},
                        });
                        await self.mediaRepo.save(media);
                    } catch (error) {
                        self.logger.warn("store_media_failed", {
                            traceId: ctx.traceId,
                            error: error instanceof Error ? error.message : String(error),
                        });
                    }
                } else {
                    self.logger.warn("store_media_no_media", { traceId: ctx.traceId });
                }
                return;
            }

            case "delay": {
                const delayMs = action.delay_ms ?? 0;
                const template = action.template ?? "";
                self.logger.log("delay_action_scheduled", {
                    traceId: ctx.traceId,
                    delayMs,
                });
                await self.queueService.delayedQueue.add(
                    "send",
                    {
                        tenantId: ctx.tenantId,
                        contactId: ctx.contactId,
                        template,
                        delayMs,
                    } satisfies DelayedMessageJob,
                    { delay: delayMs },
                );
                const thenActions = action.then ?? [];
                for (const thenAction of thenActions) {
                    await self.handleAction(thenAction, ctx, _state, self);
                }
                return;
            }

            case "trigger_webhook": {
                const url = action.url;
                if (!url) {
                    self.logger.warn("trigger_webhook_missing_url", { traceId: ctx.traceId });
                    return;
                }

                const method = action.method ?? "POST";
                const payload = action.payload ?? {};

                await self.queueService.webhookQueue.add(
                    "trigger",
                    {
                        url,
                        method,
                        payload,
                        traceId: ctx.traceId,
                    } satisfies WebhookTriggerJob,
                );
                return;
            }

            case "relay_to_party": {
                if (!ctx.mediationContext) {
                    self.logger.warn("relay_to_party_no_mediation_context", { traceId: ctx.traceId });
                    return;
                }

                const targetRole = action.to_party ?? ctx.mediationContext.toParty;
                if (!targetRole) {
                    self.logger.warn("relay_to_party_missing_target", { traceId: ctx.traceId });
                    return;
                }

                const mediation = await self.mediationSessionRepo.findOne({
                    where: {
                        tenantId: ctx.tenantId,
                        sessionId: ctx.sessionId,
                    } as any,
                });
                if (!mediation) {
                    self.logger.warn("relay_to_party_mediation_not_found", {
                        traceId: ctx.traceId,
                        sessionId: ctx.sessionId,
                    });
                    return;
                }

                const isPartyA = targetRole === mediation.partyARole;
                const targetContactId = isPartyA
                    ? mediation.partyAContactId
                    : (mediation.partyBContactId as string);

                const targetContact = await self.contactRepo.findOne({
                    where: { id: targetContactId as string, tenantId: ctx.tenantId },
                });
                if (!targetContact) {
                    self.logger.warn("relay_to_party_contact_not_found", {
                        traceId: ctx.traceId,
                        contactId: targetContactId,
                    });
                    return;
                }

                const incomingText = ctx.incomingMessage?.text ?? "";
                const transformTemplate = ctx.mediationContext.relayTransform;
                const transformedText = transformTemplate
                    ? transformTemplate.replace("{{message}}", incomingText)
                    : incomingText;

                if (self.sendMessageFn) {
                    await self.sendMessageFn(targetContact.phone, transformedText);
                    self.logger.log("relay_to_party_sent", {
                        traceId: ctx.traceId,
                        toParty: targetRole,
                        toContactId: targetContactId,
                    });
                } else {
                    self.logger.warn("relay_to_party_no_send_function", { traceId: ctx.traceId });
                }
                return;
            }

            case "set_context":
            case "clear_session":
            case "transition_step":
                return;

            default:
                self.logger.warn("action_unknown", {
                    traceId: ctx.traceId,
                    actionType: (action as Action).type,
                });
        }
    }
}
