import type { JobDetails } from '@app/contracts/types/job';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('job', { concurrency: 1000 })
export class JobProcessor extends WorkerHost {
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
    await job.updateProgress(100);
  }

  @OnWorkerEvent('active')
  onAdded(job: Job<JobDetails>) {
    this.logger.log(`Job started (queue=job, jobId=${job.id})`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<JobDetails>) {
    this.logger.log(`Job completed (queue=job, jobId=${job.id})`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<JobDetails>) {
    this.logger.log(
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      `Job progress updated (queue=job, jobId=${job.id}, progress=${job.progress.toString()})`,
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<JobDetails>, error: Error) {
    const state = await job.getState();
    if (state === 'failed') {
      this.logger.error(
        `Job failed after all attempts (queue=job, jobId=${job.id}, attemptsMade=${job.attemptsMade})`,
        error.stack,
      );
    }
  }
}
