import { MemoryProvider, SessionState } from "./types";

export class InMemoryProvider implements MemoryProvider {
    private store = new Map<string, { state: SessionState; expiresAt: number | null }>();

    async getSession(sessionId: string): Promise<SessionState | null> {
        const entry = this.store.get(sessionId);
        if (!entry) return null;
        if (entry.expiresAt && Date.now() > entry.expiresAt) {
            this.store.delete(sessionId);
            return null;
        }
        return entry.state;
    }

    async setSession(sessionId: string, state: SessionState, ttlMs?: number): Promise<void> {
        this.store.set(sessionId, {
            state,
            expiresAt: ttlMs ? Date.now() + ttlMs : null,
        });
    }

    async deleteSession(sessionId: string): Promise<void> {
        this.store.delete(sessionId);
    }
}
