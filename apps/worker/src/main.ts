import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';

@Module({})
class WorkerModule { }

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(WorkerModule);
    // Worker process bootstrap placeholder
    // eslint-disable-next-line no-console
    console.log('Worker started (scaffold)');
}

bootstrap().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start worker', err);
    process.exit(1);
});
