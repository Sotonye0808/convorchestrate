import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { WorkflowEngine } from "./engine";
import type { ActionExecutor } from "./action-executor";
import type { ContactState, MemoryProvider, SessionState } from "@memory/provider";
import type { WorkflowConfig } from "@schemas/workflow.schema";

class InMemoryProvider implements MemoryProvider {
    private readonly sessions = new Map<string, SessionState>();
    private readonly contacts = new Map<string, ContactState>();

    async getSession(sessionId: string): Promise<SessionState | null> {
        return this.sessions.get(sessionId) ?? null;
    }

    async setSession(sessionId: string, state: SessionState): Promise<void> {
        this.sessions.set(sessionId, state);
    }

    async deleteSession(sessionId: string): Promise<void> {
        this.sessions.delete(sessionId);
    }

    async getContact(tenantId: string, phone: string): Promise<ContactState | null> {
        return this.contacts.get(`${tenantId}:${phone}`) ?? null;
    }

    async setContact(tenantId: string, phone: string, data: ContactState): Promise<void> {
        this.contacts.set(`${tenantId}:${phone}`, data);
    }
}

class CollectingExecutor implements ActionExecutor {
    public readonly executed: string[] = [];

    async execute(action: { type: string }): Promise<void> {
        this.executed.push(action.type);
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

        assert.deepEqual(executor.executed, ["set_context", "send_message"]);
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
});
