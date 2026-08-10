import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';
import { JobModule } from './job/job.module';

@Module({
  imports: [AuthModule, JobModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class ApiGatewayModule {}
