import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MediationSession } from "../../entities/mediation-session.entity";
import { MediationsService } from "./mediations.service";
import { MediationsController } from "./mediations.controller";

@Module({
    imports: [TypeOrmModule.forFeature([MediationSession])],
    controllers: [MediationsController],
    providers: [MediationsService],
    exports: [MediationsService],
})
export class MediationsModule { }
