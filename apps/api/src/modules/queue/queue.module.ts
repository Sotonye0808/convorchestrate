import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QueueService } from "./queue.service";
import { DelayedMessageProcessor } from "./delayed-message.processor";
import { WebhookProcessor } from "./webhook.processor";

@Global()
@Module({
    imports: [ConfigModule],
    providers: [
        QueueService,
        DelayedMessageProcessor,
        WebhookProcessor,
    ],
    exports: [
        QueueService,
        DelayedMessageProcessor,
        WebhookProcessor,
    ],
})
export class QueueModule { }
