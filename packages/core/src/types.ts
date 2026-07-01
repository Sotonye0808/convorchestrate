export interface SessionState {
    sessionId: string;
    tenantId: string;
    contactId: string;
    workflowId: string;
    context: Record<string, unknown>;
    status: string;
    currentStep?: string;
    startedAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

export interface MemoryProvider {
    getSession(sessionId: string): Promise<SessionState | null>;
    setSession(sessionId: string, state: SessionState, ttlMs?: number): Promise<void>;
    deleteSession(sessionId: string): Promise<void>;
}
