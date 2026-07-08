import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactGroup } from "../../entities/contact-group.entity";
import { Contact } from "../../entities/contact.entity";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";

@Module({
    imports: [TypeOrmModule.forFeature([ContactGroup, Contact])],
    controllers: [GroupsController],
    providers: [GroupsService],
    exports: [GroupsService],
})
export class GroupsModule { }
