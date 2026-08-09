import type {
  CreateJobPayload,
  PaginationPayload,
  UserJobPayload,
  UserJobsPayload,
} from '@app/contracts/types/job';
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { JobService } from './jobs.service';

@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @MessagePattern('health')
  health() {
    return { status: 'ok' };
  }

  @MessagePattern('get_all_jobs')
  getAllJob(@Payload() data: PaginationPayload) {
    return this.jobService.getAllJob(data);
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
}
