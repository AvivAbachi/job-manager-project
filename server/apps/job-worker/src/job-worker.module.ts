import { JobsPrismaModule } from '@app/contracts/prisma';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JobStatusProcessor } from './job-status.processor';
import { JobProcessor } from './job-worker.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_BULLMQ_HOST ?? 'localhost',
        port: Number(process.env.REDIS_BULLMQ_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({ name: 'job' }),
    BullModule.registerQueue({ name: 'job-status' }),
    JobsPrismaModule,
  ],
  controllers: [],
  providers: [JobProcessor, JobStatusProcessor],
})
export class JobWorkerModule {}
