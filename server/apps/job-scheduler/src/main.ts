import { NestFactory } from '@nestjs/core';
import { JobSchedulerModule } from './job-scheduler.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(JobSchedulerModule);
}
bootstrap();
