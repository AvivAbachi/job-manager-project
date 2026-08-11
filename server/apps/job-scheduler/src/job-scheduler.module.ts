import { JobsPrismaModule } from '@app/contracts/prisma';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MaintenanceProcessor } from './job-scheduler.processor';
import { JobSchedulerService } from './job-scheduler.service';

@Module({
  imports: [
    JobsPrismaModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_BULLMQ_HOST ?? 'localhost',
        port: Number(process.env.REDIS_BULLMQ_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({
      name: 'job',
      defaultJobOptions: {
        attempts: 3,
        removeOnComplete: 1_000,
        removeOnFail: 1_000,
      },
    }),
    BullModule.registerQueue({
      name: 'scheduler',
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
      },
    }),
  ],
  controllers: [],
  providers: [JobSchedulerService, MaintenanceProcessor],
})
export class JobSchedulerModule {}
