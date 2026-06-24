import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { resolve } from "path";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LoggerModule } from "nestjs-pino";
import { Tenant } from "./entities/tenant.entity";
import { Workflow } from "./entities/workflow.entity";
import { Contact } from "./entities/contact.entity";
import { ContactTag } from "./entities/contact-tag.entity";
import { Session } from "./entities/session.entity";
import { MediationSession } from "./entities/mediation-session.entity";
import { EventLog } from "./entities/event-log.entity";
import { Media } from "./entities/media.entity";
import { AdminUser } from "./entities/admin-user.entity";
import { Campaign } from "./entities/campaign.entity";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { MediaModule } from "./modules/media/media.module";
import { CampaignModule } from "./modules/campaigns/campaign.module";
import { QueueModule } from "./modules/queue/queue.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ContactsModule } from "./modules/contacts/contacts.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { EventsModule } from "./modules/events/events.module";
import { SessionsModule } from "./modules/sessions/sessions.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { HealthModule } from "./modules/health/health.module";
import { DemoModule } from "./modules/demo/demo.module";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: resolve(__dirname, "../../../.env"),
        }),
        LoggerModule.forRoot({
            pinoHttp: {
                level: process.env.LOG_LEVEL ?? "info",
                transport: process.env.NODE_ENV !== "production"
                    ? { target: "pino-pretty", options: { colorize: true } }
                    : undefined,
                customProps: (req) => ({
                    traceId: (req as any).traceId,
                }),
            },
        }),
        TypeOrmModule.forRoot({
            type: "postgres",
            url: process.env.DATABASE_URL,
            entities: [
                Tenant,
                Workflow,
                Contact,
                ContactTag,
                Session,
                MediationSession,
                EventLog,
                Media,
                AdminUser,
                Campaign,
            ],
            synchronize: false,
        }),
        AuthModule,
        DashboardModule,
        ContactsModule,
        WorkflowsModule,
        EventsModule,
        SessionsModule,
        SettingsModule,
        MessagingModule,
        MediaModule,
        CampaignModule,
        QueueModule,
        HealthModule,
        DemoModule,
    ],
})
export class AppModule { }
