import type { JobDetails } from '@app/contracts/types/job';
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
import { JobService } from './job.service';
import {
  AuthGuard,
  Roles,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

@Controller('job')
@UseGuards(AuthGuard)
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get('all')
  @Roles(['admin'])
  getAllJobs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.jobService.getAllJobs(page, limit);
  }

  @Get('')
  getJobsByUserId(
    @Session() session: UserSession,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.jobService.getJobsByUser(session.user.id, page, limit);
  }

  @Get(':id')
  getJobById(@Param('id') id: string, @Session() session: UserSession) {
    return this.jobService.getJobById(id, session.user.id);
  }

  @Post()
  createJob(
    @Session() session: UserSession,
    @Body() data: JobDetails,
    @Headers('Idempotency-Key') key: string,
  ) {
    if (!key?.trim()) throw new BadRequestException();

    return this.jobService.createJob(session.user.id, data, key);
  }
}
