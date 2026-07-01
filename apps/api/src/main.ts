import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import multipart from "@fastify/multipart";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({ logger: true }),
    );

    const instance = app.getHttpAdapter().getInstance();

    // Capture raw body for webhook HMAC-SHA256 signature verification
    instance.addHook("preParsing", function (request: any, _reply: any, payload: any, done: any) {
        const chunks: Buffer[] = [];
        payload.on("data", (chunk: Buffer) => chunks.push(chunk));
        payload.on("end", () => {
            request.rawBody = Buffer.concat(chunks).toString("utf-8");
        });
        done();
    });

    app.setGlobalPrefix("api");

    await app.register(helmet, {
        contentSecurityPolicy: false,
    });

    await app.register(cors, {
        origin: process.env.CORS_ORIGIN ?? "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization"],
    });

    await app.register(rateLimit, {
        max: 100,
        timeWindow: "1 minute",
        keyGenerator: (request) => {
            return request.ip;
        },
    });

    await app.register(multipart, {
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    });

    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen(port, "0.0.0.0");
}

bootstrap().catch((err) => {
    process.stderr.write(`Failed to start api app: ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
});
