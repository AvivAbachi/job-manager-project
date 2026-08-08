import { NestFactory } from '@nestjs/core';
import { JobWorkerModule } from './worker.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(JobWorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
}
bootstrap();
