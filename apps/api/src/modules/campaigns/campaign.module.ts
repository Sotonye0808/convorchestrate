import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Campaign } from "../../entities/campaign.entity";
import { Contact } from "../../entities/contact.entity";
import { Session } from "../../entities/session.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Tenant } from "../../entities/tenant.entity";
import { CampaignService } from "./campaign.service";
import { CampaignController } from "./campaign.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Campaign, Contact, Session, Workflow, Tenant]),
    ],
    controllers: [CampaignController],
    providers: [CampaignService],
    exports: [CampaignService],
})
export class CampaignModule { }
