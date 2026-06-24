import "reflect-metadata";
import { config as loadEnv } from "dotenv";
import { resolve } from "path";
import { DataSource } from "typeorm";
import {
    AdminUser,
    Campaign,
    Contact,
    ContactTag,
    EventLog,
    Media,
    MediationSession,
    Session,
    Tenant,
    Workflow,
} from "../entities";

loadEnv({ path: resolve(__dirname, "../../../../.env") });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for TypeORM migrations");
}

export const AppDataSource = new DataSource({
    type: "postgres",
    url: databaseUrl,
    entities: [
        AdminUser,
        Campaign,
        Contact,
        ContactTag,
        EventLog,
        Media,
        MediationSession,
        Session,
        Tenant,
        Workflow,
    ],
    migrations: [__dirname + "/migrations/*.{ts,js}"],
    synchronize: false,
});
