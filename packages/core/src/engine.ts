import type {
    Action,
    Condition,
    EventHandler,
    Step,
    WorkflowConfig,
} from "@convorchestrate/schemas";
import type { MemoryProvider, SessionState } from "./types";
import type { ActionExecutor } from "./action-executor";

const STATE_MUTATING_TYPES: ReadonlySet<string> = new Set([
    "set_context",
    "clear_session",
    "transition_step",
]);

export interface EngineContext {
    tenantId: string;
    contactId: string;
    sessionId: string;
    traceId: string;
    trigger?: string;
    incomingMessage?: NormalizedMessage;
    mediationContext?: MediationContext;
}

export interface NormalizedMessage {
    type: "text" | "image" | "video" | "document" | "audio";
    text?: string;
    mediaUrl?: string;
    mediaLocalPath?: string;
    timestamp: Date;
    raw: unknown;
}

export interface MediationContext {
    sessionId: string;
    fromParty: string;
    toParty: string;
    parties: Record<string, string>;
    relayTransform?: string;
}

export interface EngineLogger {
    error(message: string, meta?: Record<string, unknown>): void;
}

export class WorkflowEngine {
    constructor(
        private readonly memoryProvider: MemoryProvider,
        private readonly actionExecutor: ActionExecutor,
        private readonly logger: EngineLogger,
    ) { }

    async process(config: WorkflowConfig, ctx: EngineContext): Promise<void> {
        switch (config.type) {
            case "reactive":
                await this.processReactive(config, ctx);
                return;
            case "sequential":
                await this.processSequential(config, ctx);
                return;
            case "mediation":
                await this.processMediation(config, ctx);
                return;
            default:
                return;
        }
    }

    private async processReactive(config: WorkflowConfig, ctx: EngineContext): Promise<void> {
        const state = await this.getOrCreateState(config, ctx);

        for (const handler of config.handlers ?? []) {
            if (!this.shouldRunHandler(handler, ctx, state)) {
                continue;
            }

            await this.executeActions(handler.actions, ctx, state, config.timeout_ms);
            return;
        }
    }

    private async processSequential(config: WorkflowConfig, ctx: EngineContext): Promise<void> {
        const state = await this.getOrCreateState(config, ctx);
        const steps = config.steps ?? [];

        const currentStepId = state.currentStep;
        const stepIndex = currentStepId
            ? steps.findIndex((s) => s.id === currentStepId)
            : 0;

        if (stepIndex < 0 || stepIndex >= steps.length) {
            return;
        }

        const step = steps[stepIndex];

        if (step.conditions && step.conditions.length > 0) {
            const allMatch = step.conditions.every((c) => this.evaluateCondition(c, ctx, state));
            if (!allMatch) {
                return;
            }
        }

        await this.executeActions(step.actions ?? [], ctx, state, step.timeout_ms ?? config.timeout_ms);
    }

    private async processMediation(config: WorkflowConfig, ctx: EngineContext): Promise<void> {
        const state = await this.getOrCreateState(config, ctx);

        if (!ctx.mediationContext) {
            this.logger.error("mediation_missing_context", { traceId: ctx.traceId });
            return;
        }

        for (const handler of config.handlers ?? []) {
            if (handler.event !== "message_received" && handler.event !== "campaign_start") {
                continue;
            }

            const conditions = handler.conditions ?? [];
            const allMatch = conditions.every((c) => this.evaluateCondition(c, ctx, state));
            if (!allMatch) {
                continue;
            }

            await this.executeActions(handler.actions, ctx, state, config.timeout_ms);
            return;
        }
    }

    private async executeActions(
        actions: Action[],
        ctx: EngineContext,
        state: SessionState,
        timeoutMs?: number,
    ): Promise<void> {
        for (const action of actions) {
            try {
                this.applyInMemoryMutation(action, state);
                await this.actionExecutor.execute(action, ctx, state);

                if (this.shouldPersistState(action)) {
                    state.updatedAt = new Date();
                    await this.memoryProvider.setSession(state.sessionId, state, timeoutMs);
                }
            } catch (error) {
                this.logger.error("action_execution_failed", {
                    traceId: ctx.traceId,
                    actionType: action.type,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }
    }

    private shouldRunHandler(
        handler: EventHandler,
        ctx: EngineContext,
        state: SessionState,
    ): boolean {
        if (handler.event === "message_received" || handler.event === "campaign_start") {
            if (ctx.trigger === "campaign_start" && handler.event !== "campaign_start") {
                return false;
            }
            if (ctx.incomingMessage && handler.event !== "message_received") {
                return false;
            }
            if (!ctx.incomingMessage && !ctx.trigger) {
                return false;
            }
        } else {
            return false;
        }

        const conditions = handler.conditions ?? [];
        return conditions.every((condition) => this.evaluateCondition(condition, ctx, state));
    }

    private evaluateCondition(
        condition: Condition,
        ctx: EngineContext,
        state: SessionState,
    ): boolean {
        switch (condition.type) {
            case "always":
                return true;
            case "media_received":
                return Boolean(ctx.incomingMessage && ctx.incomingMessage.type !== "text");
            case "context_equals": {
                if (!condition.field) {
                    return false;
                }
                return state.context[condition.field] === condition.value;
            }
            case "tag_exists": {
                const tags = state.context.tags;
                if (!Array.isArray(tags) || typeof condition.value !== "string") {
                    return false;
                }
                return tags.includes(condition.value);
            }
            case "text_match": {
                const messageText = ctx.incomingMessage?.text;
                if (typeof messageText !== "string" || typeof condition.value !== "string") {
                    return false;
                }

                const mode = condition.match ?? "exact";
                if (mode === "contains") {
                    return messageText.includes(condition.value);
                }
                if (mode === "case_insensitive") {
                    return messageText.toLowerCase() === condition.value.toLowerCase();
                }
                if (mode === "regex") {
                    const expression = new RegExp(condition.value);
                    return expression.test(messageText);
                }
                return messageText === condition.value;
            }
            default:
                return false;
        }
    }

    private shouldPersistState(action: Action): boolean {
        if (action.persist_state !== undefined) {
            return action.persist_state;
        }
        return STATE_MUTATING_TYPES.has(action.type);
    }

    private applyInMemoryMutation(action: Action, state: SessionState): void {
        if (action.type === "set_context" && action.key) {
            state.context[action.key] = action.value;
            return;
        }

        if (action.type === "clear_session") {
            state.context = {};
            state.status = "completed";
            return;
        }

        if (action.type === "transition_step" && action.next_step) {
            state.currentStep = action.next_step;
        }
    }

    private async getOrCreateState(config: WorkflowConfig, ctx: EngineContext): Promise<SessionState> {
        const existing = await this.memoryProvider.getSession(ctx.sessionId);
        if (existing) {
            return existing;
        }

        const now = new Date();
        const initialState: SessionState = {
            sessionId: ctx.sessionId,
            tenantId: ctx.tenantId,
            contactId: ctx.contactId,
            workflowId: config.workflow_id,
            context: {},
            status: "active",
            startedAt: now,
            updatedAt: now,
        };

        if (config.type === "sequential") {
            initialState.currentStep = config.steps?.[0]?.id;
        }

        await this.memoryProvider.setSession(ctx.sessionId, initialState, config.timeout_ms);
        return initialState;
    }
}
