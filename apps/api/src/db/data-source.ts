import "reflect-metadata";
import { DataSource } from "typeorm";
import {
    AdminUser,
    Contact,
    ContactTag,
    EventLog,
    Media,
    MediationSession,
    Session,
    Tenant,
    Workflow,
} from "../entities";

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: [
        Tenant,
        Workflow,
        Contact,
        ContactTag,
        Session,
        MediationSession,
        EventLog,
        Media,
        AdminUser,
    ],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
    synchronize: false,
});
