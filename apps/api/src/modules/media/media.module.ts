import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Media } from "../../entities/media.entity";
import { Session } from "../../entities/session.entity";
import { MediaController } from "./media.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Media, Session])],
    controllers: [MediaController],
})
export class MediaModule { }
