import { NestFactory } from '@nestjs/core';
import { JobWorkerModule } from './job-worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(JobWorkerModule);
}
bootstrap();
