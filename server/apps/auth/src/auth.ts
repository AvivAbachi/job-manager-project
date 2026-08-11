import { AuthPrismaService } from '@app/contracts/prisma';
import { redisStorage } from '@better-auth/redis-storage';
import { Auth } from '@thallesp/nestjs-better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth/minimal';
import { admin } from 'better-auth/plugins';
import Redis from 'ioredis';

export function createAuth(prisma: AuthPrismaService): Auth {
  const redis = new Redis({
    port: Number(process.env.REDIS_AUTH_PORT ?? 6378),
    host: process.env.REDIS_AUTH_HOST ?? 'localhost',
  });

  return betterAuth({
    trustedOrigins: [
      process.env.BETTER_AUTH_URL,
      process.env.CLIENT_URL,
    ].filter((url) => url !== undefined),
    database: prismaAdapter(prisma, { provider: 'postgresql' }),
    emailAndPassword: { enabled: true },
    plugins: [admin()],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    secondaryStorage: redisStorage({
      client: redis,
    }),
  });
}
