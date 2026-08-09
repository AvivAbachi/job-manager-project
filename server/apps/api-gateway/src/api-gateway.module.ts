import { Module } from '@nestjs/common';
import { JobModule } from './job/job.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';

@Module({
  imports: [AuthModule, JobModule, NotificationModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class ApiGatewayModule {}
