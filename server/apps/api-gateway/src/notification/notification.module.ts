import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'NOTIFICATION_CLIENT',
        transport: Transport.TCP,
        options: {
          host: process.env.NOTIFICATION_HOST ?? 'localhost',
          port: Number(process.env.NOTIFICATION_PORT ?? 3002),
        },
      },
    ]),
  ],
  providers: [NotificationService],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}
