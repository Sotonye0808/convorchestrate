import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WATemplate } from "../../entities/wa-template.entity";
import { MessagingModule } from "../messaging/messaging.module";
import { TemplatesController } from "./templates.controller";
import { TemplatesService } from "./templates.service";

@Module({
    imports: [TypeOrmModule.forFeature([WATemplate]), MessagingModule],
    controllers: [TemplatesController],
    providers: [TemplatesService],
    exports: [TemplatesService],
})
export class TemplatesModule { }
