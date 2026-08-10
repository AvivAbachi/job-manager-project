import { PrismaModule } from '@app/contracts';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { MaintenanceProcessor } from './job-scheduler.processor';
import { JobSchedulerService } from './job-scheduler.service';

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
