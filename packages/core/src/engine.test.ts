import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WorkflowEngine } from "./engine";
import type { ActionExecutor } from "./action-executor";
import type { MemoryProvider, SessionState } from "./types";
import type { WorkflowConfig } from "@convorchestrate/schemas";

class InMemoryProvider implements MemoryProvider {
    private readonly sessions = new Map<string, SessionState>();

    async getSession(sessionId: string): Promise<SessionState | null> {
        return this.sessions.get(sessionId) ?? null;
    }

    async setSession(sessionId: string, state: SessionState): Promise<void> {
        this.sessions.set(sessionId, state);
    }

    async deleteSession(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }
}

class CollectingExecutor implements ActionExecutor {
    public readonly executed: Array<{ type: string; ctx: unknown; state: unknown }> = [];

    async execute(action: { type: string }, ctx: unknown, state: unknown): Promise<void> {
        this.executed.push({ type: action.type, ctx, state });
    }
}

const contactVerificationConfig: WorkflowConfig = {
    workflow_id: "contact_verification",
    name: "Contact Verification Campaign",
    type: "reactive",
    handlers: [
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
};

describe("WorkflowEngine reactive processing", () => {
    it("executes first matching handler actions in order", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        await engine.process(contactVerificationConfig, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s1",
            traceId: "trace-1",
            incomingMessage: {
                type: "text",
                text: "DONE",
                timestamp: new Date(),
                raw: {},
            },
        });

        assert.deepEqual(
            executor.executed.map((e) => e.type),
            ["set_context", "send_message"],
        );
        const session = await memory.getSession("s1");
        assert.equal(session?.context.text_confirmed, true);
    });

    it("does not execute handlers when conditions do not match", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        await engine.process(contactVerificationConfig, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s2",
            traceId: "trace-2",
            incomingMessage: {
                type: "text",
                text: "hello",
                timestamp: new Date(),
                raw: {},
            },
        });

        assert.equal(executor.executed.length, 0);
    });

    it("persists state after set_context action", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        await engine.process(contactVerificationConfig, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s3",
            traceId: "trace-3",
            incomingMessage: {
                type: "text",
                text: "DONE",
                timestamp: new Date(),
                raw: {},
            },
        });

        const session = await memory.getSession("s3");
        assert.ok(session);
        assert.equal(session.context.text_confirmed, true);
        assert.equal(session.status, "active");
    });

    it("persists state after clear_session action via media handler", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        const configWithMedia: WorkflowConfig = {
            workflow_id: "test_media_flow",
            name: "Media Test",
            type: "reactive",
            handlers: [
                {
                    event: "message_received",
                    conditions: [{ type: "media_received" }],
                    actions: [
                        { type: "store_media", run_ocr: false },
                        { type: "clear_session" },
                    ],
                },
            ],
        };

        await engine.process(configWithMedia, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s4",
            traceId: "trace-4",
            incomingMessage: {
                type: "image",
                mediaUrl: "https://example.com/img.jpg",
                timestamp: new Date(),
                raw: {},
            },
        });

        const session = await memory.getSession("s4");
        assert.ok(session);
        assert.equal(session.status, "completed");
        assert.deepEqual(session.context, {});
    });

    it("logs and rethrows action execution errors", async () => {
        const memory = new InMemoryProvider();
        const failingExecutor: ActionExecutor = {
            async execute(): Promise<void> {
                throw new Error("adapter_unavailable");
            },
        };
        const loggedErrors: Array<{ message: string; meta: Record<string, unknown> }> = [];
        const logger = {
            error(message: string, meta?: Record<string, unknown>) {
                loggedErrors.push({ message, meta: meta ?? {} });
            },
        };
        const engine = new WorkflowEngine(memory, failingExecutor, logger);

        await assert.rejects(
            () =>
                engine.process(contactVerificationConfig, {
                    tenantId: "t1",
                    contactId: "c1",
                    sessionId: "s5",
                    traceId: "trace-5",
                    incomingMessage: {
                        type: "text",
                        text: "DONE",
                        timestamp: new Date(),
                        raw: {},
                    },
                }),
            { message: "adapter_unavailable" },
        );

        assert.equal(loggedErrors.length, 1);
        assert.equal(loggedErrors[0].meta.actionType, "set_context");
        assert.equal(loggedErrors[0].meta.traceId, "trace-5");
    });

    it("handles always-true conditions", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        const alwaysConfig: WorkflowConfig = {
            workflow_id: "always_test",
            name: "Always True Test",
            type: "reactive",
            handlers: [
                {
                    event: "message_received",
                    conditions: [{ type: "always" }],
                    actions: [
                        { type: "set_context", key: "ran", value: true },
                    ],
                },
            ],
        };

        await engine.process(alwaysConfig, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s6",
            traceId: "trace-6",
            incomingMessage: {
                type: "text",
                text: "anything",
                timestamp: new Date(),
                raw: {},
            },
        });

        assert.equal(executor.executed.length, 1);
        const session = await memory.getSession("s6");
        assert.ok(session);
        assert.equal(session.context.ran, true);
    });

    it("does not run non-message events", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        const config: WorkflowConfig = {
            workflow_id: "campaign_test",
            name: "Campaign Start Test",
            type: "reactive",
            handlers: [
                {
                    event: "campaign_start",
                    conditions: [{ type: "always" }],
                    actions: [{ type: "send_message", template: "welcome" }],
                },
            ],
        };

        await engine.process(config, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s7",
            traceId: "trace-7",
        });

        assert.equal(executor.executed.length, 0);
    });

    it("processes campaign_start when trigger is set in context", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        const config: WorkflowConfig = {
            workflow_id: "campaign_test",
            name: "Campaign Start Test",
            type: "reactive",
            handlers: [
                {
                    event: "campaign_start",
                    conditions: [{ type: "always" }],
                    actions: [{ type: "send_message", template: "welcome" }],
                },
            ],
        };

        await engine.process(config, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s9",
            traceId: "trace-9",
            trigger: "campaign_start",
        });

        assert.equal(executor.executed.length, 1);
        assert.equal(executor.executed[0].type, "send_message");
    });

    it("reuses existing session state when available", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        await memory.setSession("s8", {
            sessionId: "s8",
            tenantId: "t1",
            contactId: "c1",
            workflowId: "contact_verification",
            context: { existing_key: "existing_value" },
            status: "active",
            startedAt: new Date("2026-01-01"),
            updatedAt: new Date("2026-01-01"),
        });

        await engine.process(contactVerificationConfig, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "s8",
            traceId: "trace-8",
            incomingMessage: {
                type: "text",
                text: "DONE",
                timestamp: new Date(),
                raw: {},
            },
        });

        const session = await memory.getSession("s8");
        assert.ok(session);
        assert.equal(session.context.existing_key, "existing_value");
        assert.equal(session.context.text_confirmed, true);
    });
});

describe("WorkflowEngine sequential processing", () => {
    it("starts at first step and transitions on transition_step", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        const config: WorkflowConfig = {
            workflow_id: "onboarding",
            name: "Onboarding",
            type: "sequential",
            steps: [
                { id: "welcome", actions: [{ type: "send_message", template: "welcome" }] },
                { id: "verify_email", actions: [{ type: "transition_step", next_step: "done" }] },
                { id: "done", actions: [{ type: "send_message", template: "complete" }] },
            ],
        };

        await engine.process(config, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "seq1",
            traceId: "trace-seq1",
            incomingMessage: { type: "text", text: "hello", timestamp: new Date(), raw: {} },
        });

        const session = await memory.getSession("seq1");
        assert.equal(session?.currentStep, "welcome");
        assert.equal(executor.executed.length, 1);
        assert.equal(executor.executed[0].type, "send_message");
    });

    it("progresses to next step when current_step in session state", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        await memory.setSession("seq2", {
            sessionId: "seq2",
            tenantId: "t1",
            contactId: "c1",
            workflowId: "onboarding",
            context: {},
            status: "active",
            currentStep: "verify_email",
            startedAt: new Date(),
            updatedAt: new Date(),
        });

        const config: WorkflowConfig = {
            workflow_id: "onboarding",
            name: "Onboarding",
            type: "sequential",
            steps: [
                { id: "welcome", actions: [{ type: "send_message", template: "welcome" }] },
                { id: "verify_email", actions: [{ type: "transition_step", next_step: "done" }] },
                { id: "done", actions: [{ type: "send_message", template: "complete" }] },
            ],
        };

        await engine.process(config, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "seq2",
            traceId: "trace-seq2",
            incomingMessage: { type: "text", text: "verify", timestamp: new Date(), raw: {} },
        });

        const session = await memory.getSession("seq2");
        assert.equal(session?.currentStep, "done");
        assert.equal(executor.executed.length, 1);
        assert.equal(executor.executed[0].type, "transition_step");
    });
});

describe("WorkflowEngine mediation processing", () => {
    it("relays message to the other party via mediation context", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        const config: WorkflowConfig = {
            workflow_id: "mediation_test",
            name: "Mediation Test",
            type: "mediation",
            parties: [
                { role: "buyer", label: "Buyer" },
                { role: "seller", label: "Seller" },
            ],
            handlers: [
                {
                    event: "message_received",
                    conditions: [{ type: "always" }],
                    actions: [
                        { type: "relay_to_party", to_party: "seller" },
                    ],
                },
            ],
        };

        await engine.process(config, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "med1",
            traceId: "trace-med1",
            incomingMessage: { type: "text", text: "I want to buy", timestamp: new Date(), raw: {} },
            mediationContext: {
                sessionId: "med1",
                fromParty: "buyer",
                toParty: "seller",
                parties: { buyer: "Buyer", seller: "Seller" },
            },
        });

        assert.equal(executor.executed.length, 1);
        assert.equal(executor.executed[0].type, "relay_to_party");
    });

    it("does not execute handlers when conditions do not match", async () => {
        const memory = new InMemoryProvider();
        const executor = new CollectingExecutor();
        const logger = { error: () => undefined };
        const engine = new WorkflowEngine(memory, executor, logger);

        const config: WorkflowConfig = {
            workflow_id: "mediation_test",
            name: "Mediation Test",
            type: "mediation",
            parties: [
                { role: "buyer", label: "Buyer" },
                { role: "seller", label: "Seller" },
            ],
            handlers: [
                {
                    event: "message_received",
                    conditions: [{ type: "text_match", value: "deal", match: "contains" }],
                    actions: [
                        { type: "tag_user", tag: "deal_agreed" },
                    ],
                },
            ],
        };

        await engine.process(config, {
            tenantId: "t1",
            contactId: "c1",
            sessionId: "med2",
            traceId: "trace-med2",
            incomingMessage: { type: "text", text: "hello", timestamp: new Date(), raw: {} },
            mediationContext: {
                sessionId: "med2",
                fromParty: "buyer",
                toParty: "seller",
                parties: { buyer: "Buyer", seller: "Seller" },
            },
        });

        assert.equal(executor.executed.length, 0);
    });
});
