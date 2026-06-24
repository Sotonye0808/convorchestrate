import { Controller, Get, Res, Logger } from "@nestjs/common";
import { FastifyReply } from "fastify";
import { WwjsAdapter } from "@convorchestrate/adapters";

@Controller("qr")
export class QrController {
    private readonly logger = new Logger(QrController.name);

    constructor(private readonly adapter: WwjsAdapter) { }

    @Get("stream")
    async streamQr(@Res() reply: FastifyReply): Promise<void> {
        reply.raw.writeHead(200, {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        });

        const onQr = (qr: string) => {
            reply.raw.write(`data: ${JSON.stringify({ qr })}\n\n`);
        };

        const onReady = () => {
            reply.raw.write(`data: ${JSON.stringify({ status: "ready" })}\n\n`);
        };

        const onError = (msg: string) => {
            reply.raw.write(`data: ${JSON.stringify({ status: "error", message: msg })}\n\n`);
        };

        this.adapter.events.on("qr", onQr);
        this.adapter.events.on("ready", onReady);
        this.adapter.events.on("auth_failure", onError);

        reply.raw.on("close", () => {
            this.adapter.events.off("qr", onQr);
            this.adapter.events.off("ready", onReady);
            this.adapter.events.off("auth_failure", onError);
        });
    }
}
