import { PrismaService } from '@app/contracts';
import type {
  CreateJobPayload,
  JobDetails,
  JobStatusUpdate,
  UserJobPayload,
  UserJobsPayload,
} from '@app/contracts/types/job';
import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Queue } from 'bullmq';

@Injectable()
export class JobService {
  constructor(
    @InjectQueue('job') private readonly jobQueue: Queue<JobDetails>,
    private readonly prisma: PrismaService,
  ) {}

  async onApplicationBootstrap() {
    await this.jobQueue.waitUntilReady();
    const jobQueue = await this.jobQueue.getJobs([
      'active',
      'completed',
      'failed',
    ]);

    const [, leftJob] = await this.prisma.$transaction([
      this.prisma.jobOutbox.deleteMany({
        where: {
          jobId: {
            in: jobQueue.map((j) => j.id).filter((id) => id !== undefined),
          },
        },
      }),
      this.prisma.jobOutbox.findMany({
        include: {
          job: true,
        },
      }),
    ]);

    const toAdd = leftJob
      .filter((j) => j.job.status === 'PENDING')
      .map((j) => ({
        name: 'process',
        data: {
          failStage: j.job.failStage,
          totalStages: j.job.totalStages,
          totalTime: j.job.totalTime,
        },
        opts: { jobId: j.jobId },
      }));

    await this.jobQueue.addBulk(toAdd);

    await this.prisma.jobOutbox.deleteMany({
      where: {
        jobId: {
          in: toAdd.map((j) => j.opts.jobId),
        },
      },
    });
  }

  getAllJob() {
    return this.prisma.job.findMany();
  }

  getJobsByUserId(data: UserJobsPayload) {
    return this.prisma.job.findMany({
      where: { userId: data.userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  getJobById(data: UserJobPayload) {
    return this.prisma.job.findFirst({
      where: { id: data.id, userId: data.userId },
    });
  }

  async createJob(data: CreateJobPayload) {
    try {
      await this.prisma.job.create({
        data: {
          userId: data.userId,
          key: data.key,
          ...data.details,
          jobOutbox: {
            create: {},
          },
        },
      });
    } catch (error) {
      if (
        !(error instanceof PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }
    }

    const job = await this.prisma.job.findUniqueOrThrow({
      where: {
        userId_key: {
          userId: data.userId,
          key: data.key,
        },
      },
    });

    for (const key in data.details) {
      if (data.details[key] !== job[key]) throw new ConflictException();
    }

    if (job.status === 'PENDING') {
      const existingJob = await this.jobQueue.getJob(job.id);

      if (!existingJob) {
        await this.jobQueue.add('process', data.details, { jobId: job.id });
      }
    }
    await this.prisma.jobOutbox.deleteMany({ where: { jobId: job.id } });

    return job;
  }

  async updateJob(data: JobStatusUpdate) {
    await this.prisma.job.update({
      where: { id: data.id },
      data: {
        status: data.status,
        completedAt: data.status === 'COMPLETED' ? new Date() : undefined,
        failAttempted: data.failAttempted,
      },
    });
  }
}
