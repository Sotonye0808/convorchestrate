export interface ContactState {
    tenantId: string;
    phone: string;
    tags: string[];
    metadata: Record<string, unknown>;
    updatedAt: Date;
}
export interface SessionState {
    sessionId: string;
    tenantId: string;
    contactId: string;
    workflowId: string;
    currentStep?: string;
    context: Record<string, unknown>;
    status: "active" | "completed" | "timed_out" | "error";
    startedAt: Date;
    updatedAt: Date;
}
export interface MemoryProvider {
    getSession(sessionId: string): Promise<SessionState | null>;
    setSession(sessionId: string, state: SessionState, ttlMs?: number): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
    getContact(tenantId: string, phone: string): Promise<ContactState | null>;
    setContact(tenantId: string, phone: string, data: ContactState): Promise<void>;
}
//# sourceMappingURL=provider.d.ts.map