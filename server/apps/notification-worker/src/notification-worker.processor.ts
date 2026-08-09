import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor('notification', { limiter: { duration: 10000, max: 20 } })
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor() {
    super();
  }

  async process(job: Job): Promise<any> {
    const totalSteps = 5;

    for (let step = 0; step < totalSteps; step++) {
      const isFail = Math.random() < 0.15;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const progress = Math.round((step / totalSteps) * 100);
      await job.updateProgress(progress);

      if (isFail) {
        throw Error(`Fail Job ${job.data}`);
      }
    }
  }

  @OnWorkerEvent('active')
  onAdded(job: Job) {
    this.logger.log(
      `Notification job started (queue=notification, jobId=${job.id})`,
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(
      `Notification job completed (queue=notification, jobId=${job.id})`,
    );
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    this.logger.log(
      `Notification job progress updated (queue=notification, jobId=${job.id}, progress=${job.progress})`,
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Notification job failed (queue=notification, jobId=${job.id}, attemptsMade=${job.attemptsMade})`,
      error.stack,
    );
  }
}
