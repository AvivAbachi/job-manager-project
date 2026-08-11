import { Module } from '@nestjs/common';
import { AuthPrismaService, JobsPrismaService } from './prisma.service';

@Module({ providers: [JobsPrismaService], exports: [JobsPrismaService] })
export class JobsPrismaModule {}

@Module({ providers: [AuthPrismaService], exports: [AuthPrismaService] })
export class AuthPrismaModule {}
