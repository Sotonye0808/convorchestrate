import Redis from "ioredis";
import { ContactState, MemoryProvider, SessionState } from "./provider";

export interface RedisMemoryProviderOptions {
    redisUrl: string;
    keyPrefix?: string;
}

export class RedisMemoryProvider implements MemoryProvider {
    private readonly client: Redis;
    private readonly keyPrefix: string;

    constructor(options: RedisMemoryProviderOptions) {
        this.client = new Redis(options.redisUrl);
        this.keyPrefix = options.keyPrefix ?? "convorchestrate";
    }

    async getSession(sessionId: string): Promise<SessionState | null> {
        const value = await this.client.get(this.sessionKey(sessionId));
        if (!value) {
            return null;
        }

        const parsed = JSON.parse(value) as Omit<SessionState, "startedAt" | "updatedAt"> & {
            startedAt: string;
            updatedAt: string;
        };

        return {
            ...parsed,
            startedAt: new Date(parsed.startedAt),
            updatedAt: new Date(parsed.updatedAt),
        };
    }

    async setSession(sessionId: string, state: SessionState, ttlMs?: number): Promise<void> {
        const payload = JSON.stringify(state);
        if (typeof ttlMs === "number" && ttlMs > 0) {
            await this.client.set(this.sessionKey(sessionId), payload, "PX", ttlMs);
            return;
        }
        await this.client.set(this.sessionKey(sessionId), payload);
    }

    async deleteSession(sessionId: string): Promise<void> {
        await this.client.del(this.sessionKey(sessionId));
    }

    async getContact(tenantId: string, phone: string): Promise<ContactState | null> {
        const value = await this.client.get(this.contactKey(tenantId, phone));
        if (!value) {
            return null;
        }

        const parsed = JSON.parse(value) as Omit<ContactState, "updatedAt"> & { updatedAt: string };
        return {
            ...parsed,
            updatedAt: new Date(parsed.updatedAt),
        };
    }

    async setContact(tenantId: string, phone: string, data: ContactState): Promise<void> {
        await this.client.set(this.contactKey(tenantId, phone), JSON.stringify(data));
    }

    private sessionKey(sessionId: string): string {
        return `${this.keyPrefix}:session:${sessionId}`;
    }

    private contactKey(tenantId: string, phone: string): string {
        return `${this.keyPrefix}:contact:${tenantId}:${phone}`;
    }
}
