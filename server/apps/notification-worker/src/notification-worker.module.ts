import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { NotificationProcessor } from './worker';
import { LoggerModule } from 'nestjs-pino';
import { createLoggerParams } from '@app/contracts';

@Module({
  imports: [
    LoggerModule.forRoot(createLoggerParams('notification-worker')),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({ name: 'notification' }),
  ],
  controllers: [],
  providers: [NotificationProcessor],
})
export class NotificationWorkerModule {}
