import { Controller, Get, Inject } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Controller("health")
export class HealthController {
    constructor(
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) { }

    @Get()
    async check() {
        let dbStatus = "unknown";
        try {
            await this.dataSource.query("SELECT 1");
            dbStatus = "connected";
        } catch {
            dbStatus = "disconnected";
        }

        return {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: dbStatus,
        };
    }
}
