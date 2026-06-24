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
    persist_state?: boolean;
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

export type ActionType =
    | "send_message"
    | "tag_user"
    | "store_media"
    | "trigger_webhook"
    | "delay"
    | "set_context"
    | "clear_session"
    | "relay_to_party"
    | "transition_step";

export interface Party {
    role: string;
    label: string;
}

export interface RelayRule {
    from_party: string;
    to_party: string;
    transform?: string;
}

export const workflowConfigSchema: Record<string, unknown> = {
    type: "object",
    additionalProperties: false,
    required: ["workflow_id", "name", "type"],
    properties: {
        workflow_id: { type: "string", minLength: 1 },
        name: { type: "string", minLength: 1 },
        type: { enum: ["reactive", "sequential", "mediation"] },
        version: { type: "number" },
        timeout_ms: { type: "number" },
        on_timeout: { type: "array", items: { $ref: "#/definitions/action" } },
        triggers: { type: "array", items: { $ref: "#/definitions/trigger" } },
        steps: { type: "array", items: { $ref: "#/definitions/step" } },
        handlers: { type: "array", items: { $ref: "#/definitions/handler" } },
        parties: { type: "array", items: { $ref: "#/definitions/party" } },
        relay_rules: { type: "array", items: { $ref: "#/definitions/relayRule" } },
    },
    definitions: {
        trigger: {
            type: "object",
            additionalProperties: false,
            required: ["type"],
            properties: {
                type: { enum: ["message_received", "keyword", "campaign_start", "api_call"] },
                value: { type: "string" },
                match: { enum: ["exact", "contains", "regex"] },
            },
        },
        step: {
            type: "object",
            additionalProperties: false,
            required: ["id", "actions"],
            properties: {
                id: { type: "string", minLength: 1 },
                name: { type: "string" },
                conditions: { type: "array", items: { $ref: "#/definitions/condition" } },
                actions: { type: "array", items: { $ref: "#/definitions/action" } },
                next: { type: "string" },
                on_error: { type: "array", items: { $ref: "#/definitions/action" } },
                timeout_ms: { type: "number" },
            },
        },
        handler: {
            type: "object",
            additionalProperties: false,
            required: ["event", "actions"],
            properties: {
                event: { type: "string" },
                conditions: { type: "array", items: { $ref: "#/definitions/condition" } },
                actions: { type: "array", items: { $ref: "#/definitions/action" } },
            },
        },
        condition: {
            type: "object",
            additionalProperties: false,
            required: ["type"],
            properties: {
                type: { enum: ["text_match", "tag_exists", "media_received", "context_equals", "always"] },
                field: { type: "string" },
                value: { anyOf: [{ type: "string" }, { type: "boolean" }] },
                match: { enum: ["exact", "contains", "regex", "case_insensitive"] },
            },
        },
        action: {
            type: "object",
            additionalProperties: false,
            required: ["type"],
            properties: {
                type: {
                    enum: [
                        "send_message",
                        "tag_user",
                        "store_media",
                        "trigger_webhook",
                        "delay",
                        "set_context",
                        "clear_session",
                        "relay_to_party",
                        "transition_step"
                    ],
                },
                persist_state: { type: "boolean" },
                template: { type: "string" },
                text: { type: "string" },
                tag: { type: "string" },
                tag_metadata: { type: "object", additionalProperties: true },
                run_ocr: { type: "boolean" },
                url: { type: "string" },
                method: { enum: ["GET", "POST", "PUT"] },
                payload: { type: "object", additionalProperties: true },
                delay_ms: { type: "number" },
                then: { type: "array", items: { $ref: "#/definitions/action" } },
                key: { type: "string" },
                value: {},
                to_party: { type: "string" },
                next_step: { type: "string" },
            },
        },
        party: {
            type: "object",
            additionalProperties: false,
            required: ["role", "label"],
            properties: {
                role: { type: "string" },
                label: { type: "string" },
            },
        },
        relayRule: {
            type: "object",
            additionalProperties: false,
            required: ["from_party", "to_party"],
            properties: {
                from_party: { type: "string" },
                to_party: { type: "string" },
                transform: { type: "string" },
            },
        },
    },
};
