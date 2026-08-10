import { PrismaService } from '@app/contracts';
import { JobDetails } from '@app/contracts/types/job';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

const OUTBOX_BATCH_SIZE = 100;

@Processor('scheduler')
export class MaintenanceProcessor extends WorkerHost {
  constructor(
    @InjectQueue('job') private readonly jobQueue: Queue<JobDetails>,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job) {
    switch (job.name) {
      case 'publish-outbox':
        return this.publishOutbox();
    }
  }

  private async publishOutbox() {
    const jobOutbox = await this.prisma.jobOutbox.findMany({
      take: OUTBOX_BATCH_SIZE,
      orderBy: { id: 'asc' },
      include: { job: true },
    });

    const jobToAdd = jobOutbox.map((j) => ({
      name: 'process',
      data: {
        failStage: j.job.failStage,
        totalStages: j.job.totalStages,
        totalTime: j.job.totalTime,
      },
      opts: { jobId: j.jobId },
    }));

    await this.jobQueue.addBulk(jobToAdd);

    await this.prisma.jobOutbox.deleteMany({
      where: {
        jobId: {
          in: jobToAdd.map((j) => j.opts.jobId),
        },
      },
    });
  }
}
