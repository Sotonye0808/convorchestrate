import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InMemoryProvider } from "@convorchestrate/core";
import { Tenant } from "../../entities/tenant.entity";
import { ContactTag } from "../../entities/contact-tag.entity";
import { Media } from "../../entities/media.entity";
import { MediationSession } from "../../entities/mediation-session.entity";
import { Contact } from "../../entities/contact.entity";
import { EngineService } from "./engine.service";
import { QueueModule } from "../queue/queue.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, ContactTag, Media, MediationSession, Contact]),
        QueueModule,
    ],
    providers: [
        {
            provide: InMemoryProvider,
            useFactory: () => new InMemoryProvider(),
        },
        EngineService,
    ],
    exports: [EngineService],
})
export class EngineModule { }
