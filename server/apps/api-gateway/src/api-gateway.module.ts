import { Module } from '@nestjs/common';
import { JobModule } from './job/job.module';
import { NotificationModule } from './notification/notification.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { createLoggerParams } from '@app/contracts';
import { HealthController } from './health/health.controller';
import { HealthService } from './health/health.service';

@Module({
  imports: [
    LoggerModule.forRoot(createLoggerParams('api-gateway')),
    AuthModule,
    JobModule,
    NotificationModule,
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class ApiGatewayModule {}
