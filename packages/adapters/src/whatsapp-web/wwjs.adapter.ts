import { EventEmitter } from "events";
import { Client, LocalAuth, Message as WAMessage } from "whatsapp-web.js";
import {
    AdapterConfig,
    AdapterStatus,
    ChannelAdapter,
    IncomingRawMessage,
    OutgoingMessage,
} from "../channel-adapter.interface";
import { RateLimiter } from "../rate-limiter";

export class WwjsAdapter implements ChannelAdapter {
    readonly events = new EventEmitter();

    private client: Client | null = null;
    private status: AdapterStatus = "initializing";
    private deadCallbacks: Array<(tenantId: string) => void> = [];
    private messageCallbacks: Array<(msg: IncomingRawMessage) => void> = [];
    private rateLimiter: RateLimiter = new RateLimiter({ minGapMs: 1200, maxJitterMs: 1500 });
    private tenantId: string = "";
    private reconnectAttempted = false;

    async initialize(tenantId: string, config: AdapterConfig): Promise<void> {
        this.tenantId = tenantId;

        if (config.rateLimitMs !== undefined || config.jitterMs !== undefined) {
            this.rateLimiter = new RateLimiter({
                minGapMs: config.rateLimitMs ?? 1200,
                maxJitterMs: config.jitterMs ?? 1500,
            });
        }

        this.client = new Client({
            authStrategy: new LocalAuth({
                dataPath: config.sessionDataPath ?? "./wa-sessions",
            }),
            puppeteer: {
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            },
        });

        this.client.on("qr", (qr: string) => {
            this.status = "qr_pending";
            this.events.emit("qr", qr);
        });

        this.client.on("ready", () => {
            this.status = "ready";
            this.events.emit("ready");
        });

        this.client.on("authenticated", () => {
            this.events.emit("authenticated");
        });

        this.client.on("auth_failure", (msg: string) => {
            this.status = "error";
            this.events.emit("auth_failure", msg);
        });

        this.client.on("disconnected", async (reason: string) => {
            this.status = "dead";
            this.events.emit("disconnected", reason);

            for (const cb of this.deadCallbacks) {
                cb(this.tenantId);
            }

            if (!this.reconnectAttempted) {
                this.reconnectAttempted = true;
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await this.reconnect();
            }
        });

        this.client.on("message", (msg: WAMessage) => {
            const raw: IncomingRawMessage = {
                from: msg.from,
                body: msg.body,
                type: this.mapMessageType(msg.type),
                timestamp: msg.timestamp,
                raw: msg,
            };

            for (const cb of this.messageCallbacks) {
                cb(raw);
            }
        });

        await this.client.initialize();
    }

    getStatus(): AdapterStatus {
        return this.status;
    }

    async reconnect(): Promise<void> {
        this.status = "initializing";
        this.reconnectAttempted = false;

        if (this.client) {
            try {
                await this.client.destroy();
            } catch {
                // ignore destroy errors
            }
        }

        await this.initialize(this.tenantId, {});
    }

    onSessionDead(callback: (tenantId: string) => void): void {
        this.deadCallbacks.push(callback);
    }

    async sendMessage(to: string, message: OutgoingMessage): Promise<void> {
        await this.rateLimiter.waitForSlot(to);

        if (!this.client) {
            throw new Error("adapter_not_initialized");
        }

        if (message.text) {
            await this.client.sendMessage(to, message.text);
        } else if (message.mediaPath) {
            const { MessageMedia } = await import("whatsapp-web.js");
            const media = MessageMedia.fromFilePath(message.mediaPath);
            await this.client.sendMessage(to, media, {});
        }
    }

    onMessage(callback: (msg: IncomingRawMessage) => void): void {
        this.messageCallbacks.push(callback);
    }

    async downloadMedia(msg: IncomingRawMessage): Promise<Buffer> {
        const waMsg = msg.raw as WAMessage;
        const media = await waMsg.downloadMedia();
        return Buffer.from(media.data, "base64");
    }

    private mapMessageType(type: string): IncomingRawMessage["type"] {
        if (type === "chat" || type === "text") return "chat";
        if (type === "image") return "image";
        if (type === "video") return "video";
        if (type === "document") return "document";
        if (type === "audio") return "audio";
        return "chat";
    }
}
