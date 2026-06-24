import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Contact } from "../../entities/contact.entity";
import { ContactTag } from "../../entities/contact-tag.entity";
import { ContactsService } from "./contacts.service";
import { ContactsController } from "./contacts.controller";

@Module({
    imports: [TypeOrmModule.forFeature([Contact, ContactTag])],
    controllers: [ContactsController],
    providers: [ContactsService],
})
export class ContactsModule { }
