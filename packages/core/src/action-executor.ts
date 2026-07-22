import type { Action } from "@convorchestrate/schemas";
import type { SessionState } from "./types";
import type { EngineContext } from "./engine";

export interface ActionExecutor {
    execute(action: Action, ctx: EngineContext, state: SessionState): Promise<void>;
}

export interface ActionExecutorLogger {
    warn(message: string, meta?: Record<string, unknown>): void;
}

export class DefaultActionExecutor implements ActionExecutor {
    constructor(private readonly logger: ActionExecutorLogger) { }

    async execute(action: Action, _ctx: EngineContext, _state: SessionState): Promise<void> {
        switch (action.type) {
            case "set_context":
            case "clear_session":
            case "transition_step":
                return;

            case "send_message":
            case "send_template_message":
            case "tag_user":
            case "store_media":
            case "trigger_webhook":
            case "delay":
            case "relay_to_party":
                this.logger.warn(`action_not_wired: ${action.type}`, {
                    actionType: action.type,
                });
                return;

            default:
                this.logger.warn("action_unknown", {
                    actionType: (action as Action).type,
                });
        }
    }
}
