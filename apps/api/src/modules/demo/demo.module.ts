import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Tenant } from "../../entities/tenant.entity";
import { Contact } from "../../entities/contact.entity";
import { Workflow } from "../../entities/workflow.entity";
import { Session } from "../../entities/session.entity";
import { AdminUser } from "../../entities/admin-user.entity";
import { DemoService } from "./demo.service";
import { DemoController } from "./demo.controller";

@Module({
    imports: [
        TypeOrmModule.forFeature([Tenant, Contact, Workflow, Session, AdminUser]),
    ],
    controllers: [DemoController],
    providers: [DemoService],
    exports: [DemoService],
})
export class DemoModule { }
