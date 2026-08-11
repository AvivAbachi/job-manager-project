import { JobsPrismaModule } from '@app/contracts/prisma';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JobController } from './jobs.controller';
import { JobService } from './jobs.service';

@Module({
  imports: [
    JobsPrismaModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_BULLMQ_HOST ?? 'localhost',
        port: Number(process.env.REDIS_BULLMQ_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({ name: 'job' }),
  ],
  controllers: [JobController],
  providers: [JobService],
})
export class JobsModule {}
