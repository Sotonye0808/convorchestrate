import { Injectable, Logger } from "@nestjs/common";
import { QueueService, type WebhookTriggerJob } from "./queue.service";

@Injectable()
export class WebhookProcessor {
    private readonly logger = new Logger(WebhookProcessor.name);

    constructor(
        private readonly queueService: QueueService,
    ) {
        this.queueService.setWebhookHandler((job: WebhookTriggerJob) => this.handle(job));
        this.logger.log("WebhookProcessor registered");
    }

    async handle(job: WebhookTriggerJob): Promise<void> {
        const fetchFn = globalThis.fetch;
        if (!fetchFn) {
            this.logger.warn("webhook_fetch_unavailable", { traceId: job.traceId });
            return;
        }

        try {
            const response = await fetchFn(job.url, {
                method: job.method,
                headers: { "Content-Type": "application/json" },
                body: job.method === "GET" ? undefined : JSON.stringify(job.payload),
            });

            if (!response.ok) {
                throw new Error(`http_${response.status}`);
            }

            this.logger.log("webhook_success", {
                traceId: job.traceId,
                url: job.url,
            });
        } catch (error) {
            this.logger.error("webhook_failed", {
                traceId: job.traceId,
                url: job.url,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
}
