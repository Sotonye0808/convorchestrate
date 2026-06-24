import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RedisMemoryProvider } from "@convorchestrate/memory";
import { Tenant } from "../../entities/tenant.entity";
import { ContactTag } from "../../entities/contact-tag.entity";
import { Media } from "../../entities/media.entity";
import { MediationSession } from "../../entities/mediation-session.entity";
import { Contact } from "../../entities/contact.entity";
import { EngineService } from "./engine.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, ContactTag, Media, MediationSession, Contact]),
        ConfigModule,
    ],
    providers: [
        {
            provide: RedisMemoryProvider,
            useFactory: (configService: ConfigService) => {
                return new RedisMemoryProvider({
                    redisUrl: configService.getOrThrow<string>("REDIS_URL"),
                    keyPrefix: "convorchestrate",
                });
            },
            inject: [ConfigService],
        },
        EngineService,
    ],
    exports: [EngineService, RedisMemoryProvider],
})
export class EngineModule { }
