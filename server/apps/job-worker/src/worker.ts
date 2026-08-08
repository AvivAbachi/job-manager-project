import type { JobDetails, JobStatusUpdate } from '@app/contracts/types/job';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Job } from 'bullmq';
import { lastValueFrom } from 'rxjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Processor('job', { limiter: { duration: 10000, max: 20 } })
export class JobProcessor extends WorkerHost {
  constructor(
    @Inject('JOB_CLIENT') private readonly jobClient: ClientProxy,
    @InjectPinoLogger(JobProcessor.name)
    private readonly logger: PinoLogger,
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
  }

  @OnWorkerEvent('active')
  async onAdded(job: Job<JobDetails>) {
    await this.updateStatus(job, 'ACTIVE');
    this.logger.info({ queue: 'job', jobId: job.id }, 'Job started');
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<JobDetails>) {
    await this.updateStatus(job, 'COMPLETED');
    this.logger.info({ queue: 'job', jobId: job.id }, 'Job completed');
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<JobDetails>) {
    this.logger.info(
      { queue: 'job', jobId: job.id, progress: job.progress },
      'Job progress updated',
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<JobDetails>, error: Error) {
    const maxAttempts = Math.max(job.opts.attempts ?? 0, 1);

    if (job.attemptsMade >= maxAttempts) {
      await this.updateStatus(job, 'FAILED');
      this.logger.error(
        {
          err: error,
          queue: 'job',
          jobId: job.id,
          attemptsMade: job.attemptsMade,
        },
        'Job failed after all attempts',
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
