import { Injectable, Logger } from "@nestjs/common";
import { ChannelAdapter, OutgoingMessage } from "@convorchestrate/adapters";
import { QueueService, type DelayedMessageJob } from "./queue.service";

@Injectable()
export class DelayedMessageProcessor {
    private readonly logger = new Logger(DelayedMessageProcessor.name);
    private adapter: ChannelAdapter | null = null;

    constructor(
        private readonly queueService: QueueService,
    ) {
        this.queueService.setDelayedHandler((job: DelayedMessageJob) => this.handle(job));
        this.logger.log("DelayedMessageProcessor registered");
    }

    setAdapter(adapter: ChannelAdapter): void {
        this.adapter = adapter;
    }

    async handle(job: DelayedMessageJob): Promise<void> {
        if (!this.adapter) {
            this.logger.warn("delayed_message_no_adapter");
            return;
        }

        const outgoing: OutgoingMessage = { text: job.template };
        await this.adapter.sendMessage(job.contactId, outgoing);

        this.logger.log("delayed_message_sent", {
            tenantId: job.tenantId,
            contactId: job.contactId,
        });
    }
}
