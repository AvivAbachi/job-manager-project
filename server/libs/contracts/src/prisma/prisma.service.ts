import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as AuthPrismaClient } from './generate/auth-generate/client';
import { PrismaClient as JobsPrismaClient } from './generate/jobs-generate/client';
import 'dotenv/config';

@Injectable()
export class JobsPrismaService
  extends JobsPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: requiredUrl('JOBS_DATABASE_URL'),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

@Injectable()
export class AuthPrismaService
  extends AuthPrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: requiredUrl('AUTH_DATABASE_URL'),
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function requiredUrl(name: 'JOBS_DATABASE_URL' | 'AUTH_DATABASE_URL') {
  const url = process.env[name];
  if (!url)
    throw new Error(`Missing required database environment variable: ${name}`);
  return url;
}
