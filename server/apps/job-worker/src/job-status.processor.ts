import { JobsPrismaService } from '@app/contracts/prisma';
import { JobStatus } from '@app/contracts/prisma/generate/jobs-generate/enums';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

interface JobStatusUpdate {
  jobId: string;
  status: JobStatus;
  completedAt?: string;
}

@Processor('job-status', { concurrency: 100 })
export class JobStatusProcessor extends WorkerHost {
  constructor(private readonly prisma: JobsPrismaService) {
    super();
  }

  async process(job: Job<JobStatusUpdate>) {
    const { jobId, status, completedAt } = job.data;
    const isTerminal =
      status === JobStatus.COMPLETED || status === JobStatus.FAILED;

    await this.prisma.job.updateMany({
      where: {
        id: jobId,
        ...(status === JobStatus.ACTIVE && { status: JobStatus.PENDING }),
      },
      data: {
        status,
        completedAt: isTerminal ? new Date(completedAt!) : null,
      },
    });
  }
}
