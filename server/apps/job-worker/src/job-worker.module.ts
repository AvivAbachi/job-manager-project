import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobProcessor } from './job-worker.processor';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'JOB_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.JOB_HOST ?? 'localhost',
          port: Number(process.env.JOB_PORT ?? 3001),
        },
      },
    ]),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: Number(process.env.REDIS_PORT ?? 6379),
      },
    }),
    BullModule.registerQueue({ name: 'job' }),
  ],
  controllers: [],
  providers: [JobProcessor],
})
export class JobWorkerModule {}
