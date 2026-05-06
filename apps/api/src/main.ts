import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Module } from '@nestjs/common';

@Module({})
class AppModule { }

async function bootstrap() {
    const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    await app.listen(3000, '0.0.0.0');
}

bootstrap().catch((err) => {
    // minimal logging for scaffold
    // eslint-disable-next-line no-console
    console.error('Failed to start api app', err);
    process.exit(1);
});
