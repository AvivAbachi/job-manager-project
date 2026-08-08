import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(
    @Inject('NOTIFICATION_CLIENT')
    private readonly notificationClient: ClientProxy,
  ) {}

  healthCheck() {
    return firstValueFrom(
      this.notificationClient
        .send<{ status: string }>('health', {})
        .pipe(timeout(5000)),
    );
  }
}
