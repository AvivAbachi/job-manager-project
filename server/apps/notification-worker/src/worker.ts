import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Processor('notification', { limiter: { duration: 10000, max: 20 } })
export class NotificationProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(NotificationProcessor.name)
    private readonly logger: PinoLogger,
  ) {
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
    this.logger.info(
      { queue: 'notification', jobId: job.id },
      'Notification job started',
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.info(
      { queue: 'notification', jobId: job.id },
      'Notification job completed',
    );
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job) {
    this.logger.info(
      { queue: 'notification', jobId: job.id, progress: job.progress },
      'Notification job progress updated',
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      {
        err: error,
        queue: 'notification',
        jobId: job.id,
        attemptsMade: job.attemptsMade,
      },
      'Notification job failed',
    );
  }
}
