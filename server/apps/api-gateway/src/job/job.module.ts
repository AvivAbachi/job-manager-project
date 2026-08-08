import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JobController } from './job.controller';
import { JobService } from './job.service';

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
  ],
  controllers: [JobController],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
