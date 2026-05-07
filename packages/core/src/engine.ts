import type {
    Action,
    Condition,
    EventHandler,
    WorkflowConfig,
} from "@schemas/workflow.schema";
import type { MemoryProvider, SessionState } from "@memory/provider";
import type { ActionExecutor } from "./action-executor";

export interface EngineContext {
    tenantId: string;
    contactId: string;
    sessionId: string;
    traceId: string;
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
        if (config.type !== "reactive") {
            return;
        }

        const state = await this.getOrCreateState(config, ctx);

        for (const handler of config.handlers ?? []) {
            if (!this.shouldRunHandler(handler, ctx, state)) {
                continue;
            }

            for (const action of handler.actions) {
                try {
                    this.applyInMemoryMutation(action, state);
                    await this.actionExecutor.execute(action, ctx, state);

                    if (this.isStateMutatingAction(action)) {
                        state.updatedAt = new Date();
                        await this.memoryProvider.setSession(state.sessionId, state, config.timeout_ms);
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

            return;
        }
    }

    private shouldRunHandler(
        handler: EventHandler,
        ctx: EngineContext,
        state: SessionState,
    ): boolean {
        if (handler.event !== "message_received") {
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

    private isStateMutatingAction(action: Action): boolean {
        return action.type === "set_context" || action.type === "clear_session" || action.type === "transition_step";
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

        await this.memoryProvider.setSession(ctx.sessionId, initialState, config.timeout_ms);
        return initialState;
    }
}
