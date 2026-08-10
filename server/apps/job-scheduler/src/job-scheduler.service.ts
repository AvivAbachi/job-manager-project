import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class JobSchedulerService implements OnModuleInit {
  constructor(
    @InjectQueue('scheduler') private readonly schedulerQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.schedulerQueue.upsertJobScheduler(
      'outbox-publisher',
      { every: 1000 },
      { name: 'publish-outbox' },
    );
  }
}
