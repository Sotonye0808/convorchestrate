import { Controller, Get, Post, Headers, Query, Body, HttpCode, HttpStatus, HttpException, Logger, Req } from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { verifyWebhookChallenge, verifyWebhookSignature, type WebhookPayload } from "@convorchestrate/meta-api";
import { WebhooksService } from "./webhooks.service";

@Controller("api/webhooks")
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly webhooksService: WebhooksService,
    ) { }

    @Get("whatsapp")
    verify(
        @Query("hub.mode") mode: string | undefined,
        @Query("hub.verify_token") verifyToken: string | undefined,
        @Query("hub.challenge") challenge: string | undefined,
    ): string {
        const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
        const result = verifyWebhookChallenge(mode, verifyToken, challenge, expectedToken ?? "");
        if (result) {
            return result;
        }
        this.logger.warn("webhook_verify_failed", { mode, verifyToken });
        throw new HttpException("Forbidden", HttpStatus.FORBIDDEN);
    }

    @Post("whatsapp")
    @HttpCode(HttpStatus.OK)
    async receive(
        @Req() req: FastifyRequest,
        @Headers("x-hub-signature-256") signature: string | undefined,
        @Body() payload: WebhookPayload,
    ): Promise<void> {
        const rawBody = (req as any).rawBody as string | undefined;
        const appSecret = process.env.META_APP_SECRET;
        const oldAppSecret = process.env.OLD_META_APP_SECRET;

        if (!rawBody) {
            this.logger.warn("webhook_missing_raw_body");
            throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        let valid = false;
        if (appSecret && verifyWebhookSignature(rawBody, signature, appSecret)) {
            valid = true;
        }
        if (!valid && oldAppSecret && verifyWebhookSignature(rawBody, signature, oldAppSecret)) {
            valid = true;
        }
        if (!valid) {
            this.logger.warn("webhook_invalid_signature");
            throw new HttpException("Unauthorized", HttpStatus.UNAUTHORIZED);
        }

        if (payload.object === "whatsapp_business_account") {
            await this.webhooksService.processDeliveryStatuses(payload);
        }
    }
}
