import { EventEmitter } from "events";

export type AdapterStatus = "initializing" | "qr_pending" | "ready" | "dead" | "error";

export interface AdapterConfig {
    sessionDataPath?: string;
    rateLimitMs?: number;
    jitterMs?: number;
}

export interface OutgoingMessage {
    text?: string;
    mediaPath?: string;
    mimetype?: string;
}

export interface IncomingRawMessage {
    from: string;
    body: string;
    type: "chat" | "image" | "video" | "document" | "audio";
    mediaKey?: string;
    mimetype?: string;
    filename?: string;
    timestamp: number;
    raw: unknown;
}

export interface ChannelAdapter {
    readonly events: EventEmitter;
    initialize(tenantId: string, config: AdapterConfig): Promise<void>;
    getStatus(): AdapterStatus;
    reconnect(): Promise<void>;
    onSessionDead(callback: (tenantId: string) => void): void;
    sendMessage(to: string, message: OutgoingMessage): Promise<void>;
    onMessage(callback: (msg: IncomingRawMessage) => void): void;
    downloadMedia(msg: IncomingRawMessage): Promise<Buffer>;
}
