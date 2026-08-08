import type {
  CreateJobPayload,
  UserJobPayload,
  JobStatusUpdate,
  UserJobsPayload,
} from '@app/contracts/types/job';
import { Controller, OnApplicationBootstrap } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobService } from './jobs.service';

@Controller('job')
export class JobController implements OnApplicationBootstrap {
  constructor(private readonly jobService: JobService) {}

  async onApplicationBootstrap() {
    await this.jobService.onApplicationBootstrap();
  }

  @MessagePattern('health')
  health() {
    return { status: 'ok' };
  }

  @MessagePattern('get_all_jobs')
  getAllJob() {
    return this.jobService.getAllJob();
  }

  @MessagePattern('get_jobs_by_user')
  getJobsByUserId(@Payload() data: UserJobsPayload) {
    return this.jobService.getJobsByUserId(data);
  }

  @MessagePattern('get_job')
  getJobsById(@Payload() data: UserJobPayload) {
    return this.jobService.getJobById(data);
  }

  @MessagePattern('create_job')
  async createJob(@Payload() data: CreateJobPayload) {
    return this.jobService.createJob(data);
  }

  @MessagePattern('update_job')
  async updateJob(@Payload() data: JobStatusUpdate) {
    await this.jobService.updateJob(data);
  }
}
