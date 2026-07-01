import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MetaApiClient } from "@convorchestrate/meta-api";
import { Tenant } from "../../entities/tenant.entity";
import { Contact } from "../../entities/contact.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Session } from "../../entities/session.entity";
import { MediationSession } from "../../entities/mediation-session.entity";
import { CampaignMessage } from "../../entities/campaign-message.entity";
import { MessagingService } from "./messaging.service";
import { EngineModule } from "../engine/engine.module";
import { QueueModule } from "../queue/queue.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, Contact, Workflow, Session, MediationSession, CampaignMessage]),
        EngineModule,
        QueueModule,
        ConfigModule,
    ],
    providers: [
        MessagingService,
        {
            provide: MetaApiClient,
            useFactory: (configService: ConfigService) => {
                return new MetaApiClient({
                    phoneNumberId: configService.getOrThrow<string>("META_PHONE_NUMBER_ID"),
                    accessToken: configService.getOrThrow<string>("META_ACCESS_TOKEN"),
                    appSecret: configService.get<string>("META_APP_SECRET"),
                    appId: configService.get<string>("META_APP_ID"),
                    wabaId: configService.get<string>("META_WABA_ID"),
                    apiVersion: configService.get<string>("META_API_VERSION") ?? "v22.0",
                });
            },
            inject: [ConfigService],
        },
    ],
    exports: [MessagingService, MetaApiClient],
})
export class MessagingModule { }
