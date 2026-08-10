import { PrismaService } from '@app/contracts';
import { JobStatus } from '@app/contracts/prisma/generate/enums';
import type {
  CreateJobPayload,
  JobDetails,
  JobListPayload,
  UserJobPayload,
  UserJobsPayload,
} from '@app/contracts/types/job';
import { InjectQueue } from '@nestjs/bullmq';
import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { Queue } from 'bullmq';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('job') private readonly jobQueue: Queue<JobDetails>,
  ) {}

  async getAllJob(data: JobListPayload) {
    const where = data.status ? { status: data.status } : undefined;
    const orderBy = this.orderBy(data);
    const [jobs, pending, active, completed, failed] =
      await this.prisma.$transaction([
        this.prisma.job.findMany({
          skip: (data.page - 1) * data.limit,
          take: data.limit,
          where,
          orderBy,
        }),
        this.prisma.job.count({ where: { status: JobStatus.PENDING } }),
        this.prisma.job.count({ where: { status: JobStatus.ACTIVE } }),
        this.prisma.job.count({ where: { status: JobStatus.COMPLETED } }),
        this.prisma.job.count({ where: { status: JobStatus.FAILED } }),
      ]);
    const total = {
      [JobStatus.PENDING]: pending,
      [JobStatus.ACTIVE]: active,
      [JobStatus.COMPLETED]: completed,
      [JobStatus.FAILED]: failed,
    };

    return { jobs, total };
  }

  async getJobsByUserId(data: UserJobsPayload) {
    const where = {
      userId: data.userId,
      ...(data.status && { status: data.status }),
    };
    const orderBy = this.orderBy(data);
    const [jobs, pending, active, completed, failed] =
      await this.prisma.$transaction([
        this.prisma.job.findMany({
          where,
          orderBy,
          skip: (data.page - 1) * data.limit,
          take: data.limit,
        }),
        this.prisma.job.count({
          where: { ...where, status: JobStatus.PENDING },
        }),
        this.prisma.job.count({
          where: { ...where, status: JobStatus.ACTIVE },
        }),
        this.prisma.job.count({
          where: { ...where, status: JobStatus.COMPLETED },
        }),
        this.prisma.job.count({
          where: { ...where, status: JobStatus.FAILED },
        }),
      ]);
    const total = {
      [JobStatus.PENDING]: pending,
      [JobStatus.ACTIVE]: active,
      [JobStatus.COMPLETED]: completed,
      [JobStatus.FAILED]: failed,
    };

    return { jobs, total };
  }

  getJobById(data: UserJobPayload) {
    return this.prisma.job.findFirst({
      where: { id: data.id, userId: data.userId },
    });
  }

  private orderBy(data: JobListPayload) {
    if (!data.sortBy) return undefined;
    const order = data.sortOrder ?? 'desc';
    switch (data.sortBy) {
      case 'id':
        return { id: order };
      case 'status':
        return { status: order };
      case 'totalStages':
        return { totalStages: order };
      case 'totalTime':
        return { totalTime: order };
      case 'updatedAt':
        return { updatedAt: order };
    }
  }

  async createJob(data: CreateJobPayload) {
    let created = false;
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
      created = true;
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

    if (created) await this.publish(job.id, data.details);

    return job;
  }

  private async publish(jobId: string, details: JobDetails) {
    try {
      await this.jobQueue.add('process', details, {
        jobId,
        attempts: 3,
        removeOnComplete: 1_000,
        removeOnFail: 1_000,
      });
      await this.prisma.jobOutbox.deleteMany({ where: { jobId } });
    } catch (error) {
      this.logger.error(
        `Job ${jobId} remains in the outbox for retry after queue publication failed`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
