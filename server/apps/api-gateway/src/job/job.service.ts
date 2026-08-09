import type {
  CreateJobPayload,
  JobDetails,
  PaginationPayload,
  UserJobPayload,
  UserJobsPayload,
} from '@app/contracts/types/job';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class JobService {
  constructor(@Inject('JOB_CLIENT') private readonly jobClient: ClientProxy) {}

  healthCheck() {
    return firstValueFrom(
      this.jobClient.send<{ status: string }>('health', {}).pipe(timeout(5000)),
    );
  }

  getAllJobs(page: number, limit: number) {
    return this.jobClient.send<unknown, PaginationPayload>('get_all_jobs', {
      page,
      limit,
    });
  }

  getJobsByUser(userId: string, page: number, limit: number) {
    return this.jobClient.send<unknown, UserJobsPayload>('get_jobs_by_user', {
      userId,
      page,
      limit,
    });
  }

  getJobById(id: string, userId: string) {
    return this.jobClient.send<unknown, UserJobPayload>('get_job', {
      id,
      userId,
    });
  }

  createJob(userId: string, details: JobDetails, key: string) {
    return this.jobClient.send<unknown, CreateJobPayload>('create_job', {
      userId,
      details,
      key,
    });
  }
}
