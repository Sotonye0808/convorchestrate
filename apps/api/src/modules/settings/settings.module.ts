import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tenant } from "../../entities/tenant.entity";
import { SettingsService } from "./settings.service";
import { SettingsController } from "./settings.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Tenant])],
    controllers: [SettingsController],
    providers: [SettingsService],
})
export class SettingsModule { }
