import { PrismaService } from '@app/contracts';
import type {
  CreateJobPayload,
  UserJobPayload,
  UserJobsPayload,
} from '@app/contracts/types/job';
import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

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

    return job;
  }
}
