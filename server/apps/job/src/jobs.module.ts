import { PrismaModule } from '@app/contracts';
import { Module } from '@nestjs/common';
import { JobController } from './jobs.controller';
import { JobService } from './jobs.service';

@Module({
  imports: [PrismaModule],
  controllers: [JobController],
  providers: [JobService],
})
export class JobsModule {}
