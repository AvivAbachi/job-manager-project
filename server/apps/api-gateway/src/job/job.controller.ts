import { JobStatus } from '@app/contracts/prisma/generate/jobs-generate/enums';
import { SortOrder } from '@app/contracts/prisma/generate/jobs-generate/internal/prismaNamespace';
import type { JobDetails, JobSortBy } from '@app/contracts/types/job';
import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import {
  CurrentSession,
  type UserSession,
} from '../auth/current-session.decorator';
import { JobService } from './job.service';

@Controller('job')
@UseGuards(AuthGuard)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('all')
  @UseGuards(AdminGuard)
  getAllJobs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.jobService.getAllJobs(
      this.jobListPayload(page, limit, status, sortBy, sortOrder),
    );
  }

  @Get('')
  getJobsByUserId(
    @CurrentSession() session: UserSession,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.jobService.getJobsByUser(
      session.user.id,
      this.jobListPayload(page, limit, status, sortBy, sortOrder),
    );
  }

  private jobListPayload(
    page: number,
    limit: number,
    status?: string,
    sortBy?: string,
    sortOrder?: string,
  ) {
    const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'FAILED'];
    const validSortFields = [
      'id',
      'status',
      'totalStages',
      'totalTime',
      'updatedAt',
    ];
    const validSortOrders = ['asc', 'desc'];
    if (!Number.isInteger(page) || page < 1) throw new BadRequestException();
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
      throw new BadRequestException();
    if (status && !validStatuses.includes(status))
      throw new BadRequestException();
    if (sortBy && !validSortFields.includes(sortBy))
      throw new BadRequestException();
    if (sortOrder && !validSortOrders.includes(sortOrder))
      throw new BadRequestException();

    return {
      page,
      limit,
      ...(status && {
        status: status as JobStatus,
      }),
      ...(sortBy && {
        sortBy: sortBy as JobSortBy,
      }),
      ...(sortOrder && {
        sortOrder: sortOrder as SortOrder,
      }),
    };
  }

  @Get(':id')
  getJobById(@Param('id') id: string, @CurrentSession() session: UserSession) {
    return this.jobService.getJobById(id, session.user.id);
  }

  @Post()
  createJob(
    @CurrentSession() session: UserSession,
    @Body() data: JobDetails,
    @Headers('Idempotency-Key') key: string,
  ) {
    if (!key?.trim()) throw new BadRequestException();
    this.validateDetails(data);

    return this.jobService.createJob(session.user.id, data, key);
  }

  private validateDetails(data: JobDetails) {
    if (
      !Number.isInteger(data.totalStages) ||
      data.totalStages < 2 ||
      data.totalStages > 50 ||
      !Number.isInteger(data.totalTime) ||
      data.totalTime < 1 ||
      data.totalTime > 300_000 ||
      (data.failStage !== null &&
        (!Number.isInteger(data.failStage) ||
          data.failStage < 0 ||
          data.failStage >= data.totalStages))
    ) {
      throw new BadRequestException();
    }
  }
}
