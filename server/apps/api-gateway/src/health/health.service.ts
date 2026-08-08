import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { JobService } from '../job/job.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly jobService: JobService,
    private readonly notificationService: NotificationService,
  ) {}

  async check() {
    const [job, notification] = await Promise.allSettled([
      this.jobService.healthCheck(),
      this.notificationService.healthCheck(),
    ]);
    const services = {
      job: job.status === 'fulfilled' ? job.value.status : 'error',
      notification:
        notification.status === 'fulfilled'
          ? notification.value.status
          : 'error',
    };

    if (job.status === 'rejected' || notification.status === 'rejected') {
      throw new ServiceUnavailableException({ status: 'error', services });
    }

    return { status: 'ok', services };
  }
}
