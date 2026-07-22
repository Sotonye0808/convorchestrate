import { Injectable, Logger } from "@nestjs/common";
import { QueueService, type DelayedMessageJob } from "./queue.service";

@Injectable()
export class DelayedMessageProcessor {
    private readonly logger = new Logger(DelayedMessageProcessor.name);
    private sendMessageFn: ((phone: string, text: string) => Promise<string>) | null = null;

    constructor(
        private readonly queueService: QueueService,
    ) {
        this.queueService.setDelayedHandler((job: DelayedMessageJob) => this.handle(job));
        this.logger.log("DelayedMessageProcessor registered");
    }

    setSendFunction(fn: (phone: string, text: string) => Promise<string>): void {
        this.sendMessageFn = fn;
    }

    async handle(job: DelayedMessageJob): Promise<void> {
        if (!this.sendMessageFn) {
            this.logger.warn("delayed_message_no_send_function");
            return;
        }

        await this.sendMessageFn(job.contactId, job.template);

        this.logger.log("delayed_message_sent", {
            tenantId: job.tenantId,
            contactId: job.contactId,
        });
    }
}
