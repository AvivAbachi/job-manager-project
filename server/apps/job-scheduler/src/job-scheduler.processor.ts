import { PrismaService } from '@app/contracts';
import { JobStatus } from '@app/contracts/prisma/generate/enums';
import { JobDetails } from '@app/contracts/types/job';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, JobType, Queue } from 'bullmq';

const JOB_STATUS_BY_QUEUE_STATE = {
  active: JobStatus.ACTIVE,
  completed: JobStatus.COMPLETED,
  failed: JobStatus.FAILED,
} as const;
const states = Object.keys(JOB_STATUS_BY_QUEUE_STATE) as JobType[];

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
      case 'reconcile':
        return this.reconcile();
    }
  }

  private async publishOutbox() {
    const jobOutbox = await this.prisma.jobOutbox.findMany({
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

  private async reconcile() {
    const jobs = await this.jobQueue.getJobs(states);
    const uniqueJobs = new Map<string, Job>();

    for (const job of jobs) {
      if (job.id) uniqueJobs.set(job.id, job);
    }

    await Promise.allSettled(
      jobs.map(async (job) => {
        const state = await job.getState();
        const status =
          JOB_STATUS_BY_QUEUE_STATE[
            state as keyof typeof JOB_STATUS_BY_QUEUE_STATE
          ];

        if (!status) return;

        const terminal = state !== 'active';
        const updated = await this.prisma.job.updateMany({
          where: { id: job.id },
          data: {
            status,
            completedAt: terminal
              ? new Date(job.finishedOn ?? Date.now())
              : null,
          },
        });

        if (terminal && updated.count > 0) await this.jobQueue.remove(job.id!);
      }),
    );
  }
}
