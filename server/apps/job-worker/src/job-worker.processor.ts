import type { JobDetails, JobStatusUpdate } from '@app/contracts/types/job';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { lastValueFrom } from 'rxjs';

@Processor('job', { limiter: { duration: 10000, max: 20 } })
export class JobProcessor extends WorkerHost {
  constructor(@Inject('JOB_CLIENT') private readonly jobClient: ClientProxy) {
    super();
  }

  private readonly logger = new Logger(JobProcessor.name);

  async process(job: Job<JobDetails>): Promise<any> {
    const totalSteps = job.data.totalStages;
    const time = job.data.totalTime / job.data.totalStages / 2;
    for (let stage = 0; stage < totalSteps; stage++) {
      await job.updateProgress(Math.round((stage / totalSteps) * 100));
      await new Promise((resolve) => setTimeout(resolve, time));
      if (job.data.failStage === stage) throw Error();
      await new Promise((resolve) => setTimeout(resolve, time));
    }
  }

  @OnWorkerEvent('active')
  async onAdded(job: Job<JobDetails>) {
    await this.updateStatus(job, 'ACTIVE');
    this.logger.log(`Job started (queue=job, jobId=${job.id})`);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<JobDetails>) {
    await this.updateStatus(job, 'COMPLETED');
    this.logger.log(`Job completed (queue=job, jobId=${job.id})`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<JobDetails>) {
    this.logger.log(
      `Job progress updated (queue=job, jobId=${job.id}, progress=${job.progress})`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<JobDetails>, error: Error) {
    const state = await job.getState();
    if (state === 'failed') {
      await this.updateStatus(job, 'FAILED');
      this.logger.error(
        `Job failed after all attempts (queue=job, jobId=${job.id}, attemptsMade=${job.attemptsMade})`,
        error.stack,
      );
    }
  }

  private async updateStatus(
    job: Job<JobDetails>,
    status: JobStatusUpdate['status'],
  ) {
    await lastValueFrom(
      this.jobClient.send('update_job', {
        id: job.id!,
        status,
        failAttempted: job.attemptsMade !== 0 ? job.attemptsMade : undefined,
      }),
    );
  }
}
