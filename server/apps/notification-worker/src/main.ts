import { NestFactory } from '@nestjs/core';
import { NotificationWorkerModule } from './notification-worker.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(
    NotificationWorkerModule,
    {
      bufferLogs: true,
    },
  );
  app.useLogger(app.get(Logger));
}
bootstrap();
