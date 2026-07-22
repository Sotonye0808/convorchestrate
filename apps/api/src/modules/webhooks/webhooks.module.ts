import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WebhooksController } from "./webhooks.controller";
import { WebhooksService } from "./webhooks.service";
import { CampaignMessage } from "../../entities/campaign-message.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([CampaignMessage]),
    ],
    controllers: [WebhooksController],
    providers: [WebhooksService],
    exports: [WebhooksService],
})
export class WebhooksModule { }
