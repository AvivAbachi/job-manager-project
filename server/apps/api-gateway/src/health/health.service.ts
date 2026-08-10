import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { JobService } from '../job/job.service';

@Injectable()
export class HealthService {
  constructor(private readonly jobService: JobService) {}

  async check() {
    const [job] = await Promise.allSettled([this.jobService.healthCheck()]);
    const services = {
      job: job.status === 'fulfilled' ? job.value.status : 'error',
    };

    if (job.status === 'rejected') {
      throw new ServiceUnavailableException({ status: 'error', services });
    }

    return { status: 'ok', services };
  }
}
