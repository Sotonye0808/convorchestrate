import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  // Worker process bootstrap placeholder
  // eslint-disable-next-line no-console
  console.log("Worker started (scaffold)");
  await app.close();
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start worker", err);
  process.exit(1);
});
