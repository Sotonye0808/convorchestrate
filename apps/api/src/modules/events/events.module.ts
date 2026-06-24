import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EventLog } from "../../entities/event-log.entity";
import { EventsService } from "./events.service";
import { EventsController } from "./events.controller";

@Module({
    imports: [TypeOrmModule.forFeature([EventLog])],
    controllers: [EventsController],
    providers: [EventsService],
})
export class EventsModule { }
