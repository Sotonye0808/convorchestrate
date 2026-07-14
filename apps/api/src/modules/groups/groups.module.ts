import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ContactGroup } from "../../entities/contact-group.entity";
import { Contact } from "../../entities/contact.entity";
import { ContactTag } from "../../entities/contact-tag.entity";
import { GroupsController } from "./groups.controller";
import { GroupsService } from "./groups.service";

@Module({
    imports: [TypeOrmModule.forFeature([ContactGroup, Contact, ContactTag])],
    controllers: [GroupsController],
    providers: [GroupsService],
    exports: [GroupsService],
})
export class GroupsModule { }
