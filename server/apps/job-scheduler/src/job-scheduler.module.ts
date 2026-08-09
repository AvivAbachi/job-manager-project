import { Module } from '@nestjs/common';
import { JobSchedulerService } from './job-scheduler.service';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '@app/contracts';
import { MaintenanceProcessor } from './job-scheduler.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({
      name: 'job',
      defaultJobOptions: {
        attempts: 3,
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
