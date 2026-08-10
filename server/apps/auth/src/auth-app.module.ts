import { PrismaModule, PrismaService } from '@app/contracts';
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { createAuth } from './auth';
import { AuthHealthController } from './health.controller';

@Module({
  imports: [
    PrismaModule,
    BetterAuthModule.forRootAsync({
      imports: [PrismaModule],
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({ auth: createAuth(prisma) }),
    }),
  ],
  controllers: [AuthHealthController],
})
export class AuthAppModule {}
