import { AuthPrismaModule, AuthPrismaService } from '@app/contracts/prisma';
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from './auth';
import { AuthHealthController } from './health.controller';

@Module({
  imports: [
    AuthPrismaModule,
    BetterAuthModule.forRootAsync({
      imports: [AuthPrismaModule],
      inject: [AuthPrismaService],
      useFactory: (prisma: AuthPrismaService) => ({ auth: createAuth(prisma) }),
    }),
  ],
  controllers: [AuthHealthController],
})
export class AuthAppModule {}
