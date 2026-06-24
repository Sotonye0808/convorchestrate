import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { WwjsAdapter } from "@convorchestrate/adapters";
import { Tenant } from "../../entities/tenant.entity";
import { Contact } from "../../entities/contact.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Session } from "../../entities/session.entity";
import { MediationSession } from "../../entities/mediation-session.entity";
import { MessagingService } from "./messaging.service";
import { QrController } from "./qr.controller";
import { EngineModule } from "../engine/engine.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, Contact, Workflow, Session, MediationSession]),
        EngineModule,
    ],
    controllers: [QrController],
    providers: [
        MessagingService,
        {
            provide: WwjsAdapter,
            useFactory: () => new WwjsAdapter(),
        },
    ],
    exports: [MessagingService, WwjsAdapter],
})
export class MessagingModule { }
