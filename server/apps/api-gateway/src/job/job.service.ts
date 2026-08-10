import type {
  CreateJobPayload,
  JobDetails,
  JobListPayload,
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

  getAllJobs(data: JobListPayload) {
    return this.jobClient.send<unknown, JobListPayload>('get_all_jobs', data);
  }

  getJobsByUser(userId: string, data: JobListPayload) {
    return this.jobClient.send<unknown, UserJobsPayload>('get_jobs_by_user', {
      userId,
      ...data,
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
