import { PrismaService } from '@app/contracts';
import { JobStatus } from '@app/contracts/prisma/generate/enums';
import type {
  CreateJobPayload,
  PaginationPayload,
  UserJobPayload,
  UserJobsPayload,
} from '@app/contracts/types/job';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllJob(data: PaginationPayload) {
    const [jobs, pending, active, completed, failed] =
      await this.prisma.$transaction([
        this.prisma.job.findMany({
          skip: (data.page - 1) * data.limit,
          take: data.limit,
          orderBy: { createdAt: 'desc' },
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
    const where = { userId: data.userId };
    const [jobs, pending, active, completed, failed] =
      await this.prisma.$transaction([
        this.prisma.job.findMany({
          where,
          orderBy: { createdAt: 'desc' },
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

    return job;
  }
}
