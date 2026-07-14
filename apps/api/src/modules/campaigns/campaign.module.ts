import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Campaign } from "../../entities/campaign.entity";
import { CampaignMessage } from "../../entities/campaign-message.entity";
import { WATemplate } from "../../entities/wa-template.entity";
import { ContactGroup } from "../../entities/contact-group.entity";
import { Contact } from "../../entities/contact.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Tenant } from "../../entities/tenant.entity";
import { MessagingModule } from "../messaging/messaging.module";
import { EngineModule } from "../engine/engine.module";
import { QueueModule } from "../queue/queue.module";
import { CampaignService } from "./campaign.service";
import { CampaignController } from "./campaign.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Campaign, CampaignMessage, WATemplate, ContactGroup, Contact, Workflow, Tenant]),
        MessagingModule,
        EngineModule,
        QueueModule,
    ],
    controllers: [CampaignController],
    providers: [CampaignService],
    exports: [CampaignService],
})
export class CampaignModule { }
