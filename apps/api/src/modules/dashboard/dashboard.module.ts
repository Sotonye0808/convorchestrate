import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Session } from "../../entities/session.entity";
import { Contact } from "../../entities/contact.entity";
import { ContactTag } from "../../entities/contact-tag.entity";
import { Campaign } from "../../entities/campaign.entity";
import { DashboardService } from "./dashboard.service";
import { DashboardController } from "./dashboard.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Session, Contact, ContactTag, Campaign]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
})
export class DashboardModule { }
