import { JobStatus } from '@app/contracts/prisma/generate/enums';
import type { JobDetails } from '@app/contracts/types/job';
import {
  InjectQueue,
  OnWorkerEvent,
  Processor,
  WorkerHost,
} from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';

interface JobStatusUpdate {
  jobId: string;
  status: JobStatus;
  completedAt?: string;
}

@Processor('job', { concurrency: 100 })
export class JobProcessor extends WorkerHost {
  private readonly logger = new Logger(JobProcessor.name);

  constructor(
    @InjectQueue('job-status')
    private readonly statusQueue: Queue<JobStatusUpdate>,
  ) {
    super();
  }

  async process(job: Job<JobDetails>): Promise<any> {
    const totalSteps = job.data.totalStages;
    const time = job.data.totalTime / job.data.totalStages / 2;
    for (let stage = 0; stage < totalSteps; stage++) {
      await job.updateProgress(Math.round((stage / totalSteps) * 100));
      await new Promise((resolve) => setTimeout(resolve, time));
      if (job.data.failStage === stage) throw Error();
      await new Promise((resolve) => setTimeout(resolve, time));
    }
    await job.updateProgress(100);
  }

  @OnWorkerEvent('active')
  async onAdded(job: Job<JobDetails>) {
    await this.updateStatus(job.id!, JobStatus.ACTIVE);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<JobDetails>) {
    await this.updateStatus(job.id!, JobStatus.COMPLETED, new Date());
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<JobDetails>, error: Error) {
    if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
      await this.updateStatus(job.id!, JobStatus.FAILED, new Date());
      this.logger.error(
        `Job failed after all attempts (queue=job, jobId=${job.id}, attemptsMade=${job.attemptsMade})`,
        error.stack,
      );
    }
  }

  private async updateStatus(
    jobId: string,
    status: JobStatus,
    completedAt?: Date,
  ) {
    await this.statusQueue.add(
      'persist',
      { jobId, status, completedAt: completedAt?.toISOString() },
      {
        jobId: `${jobId}-${status}`,
        attempts: 1_000_000,
        backoff: { type: 'fixed', delay: 1000 },
        removeOnComplete: 1_000,
      },
    );
  }
}
