import { NestFactory } from '@nestjs/core';
import { NotificationWorkerModule } from './notification-worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(NotificationWorkerModule);
}
bootstrap();
