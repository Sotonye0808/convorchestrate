import type { Action } from "@schemas/workflow.schema";
import type { SessionState } from "@memory/provider";
import type { EngineContext } from "./engine";

export interface ActionExecutor {
    execute(action: Action, ctx: EngineContext, state: SessionState): Promise<void>;
}
