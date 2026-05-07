export type WorkflowType = "reactive" | "sequential" | "mediation";
export interface WorkflowConfig {
    workflow_id: string;
    name: string;
    type: WorkflowType;
    version?: number;
    timeout_ms?: number;
    on_timeout?: Action[];
    triggers?: Trigger[];
    steps?: Step[];
    handlers?: EventHandler[];
    parties?: Party[];
    relay_rules?: RelayRule[];
}
export interface Trigger {
    type: "message_received" | "keyword" | "campaign_start" | "api_call";
    value?: string;
    match?: "exact" | "contains" | "regex";
}
export interface Step {
    id: string;
    name?: string;
    conditions?: Condition[];
    actions: Action[];
    next?: string;
    on_error?: Action[];
    timeout_ms?: number;
}
export interface EventHandler {
    event: string;
    conditions?: Condition[];
    actions: Action[];
}
export interface Condition {
    type: "text_match" | "tag_exists" | "media_received" | "context_equals" | "always";
    field?: string;
    value?: string | boolean;
    match?: "exact" | "contains" | "regex" | "case_insensitive";
}
export interface Action {
    type: ActionType;
    template?: string;
    text?: string;
    tag?: string;
    tag_metadata?: Record<string, unknown>;
    run_ocr?: boolean;
    url?: string;
    method?: "GET" | "POST" | "PUT";
    payload?: Record<string, unknown>;
    delay_ms?: number;
    then?: Action[];
    key?: string;
    value?: unknown;
    to_party?: string;
    next_step?: string;
}
export type ActionType = "send_message" | "tag_user" | "store_media" | "trigger_webhook" | "delay" | "set_context" | "clear_session" | "relay_to_party" | "transition_step";
export interface Party {
    role: string;
    label: string;
}
export interface RelayRule {
    from_party: string;
    to_party: string;
    transform?: string;
}
export declare const workflowConfigSchema: Record<string, unknown>;
//# sourceMappingURL=workflow.schema.d.ts.map