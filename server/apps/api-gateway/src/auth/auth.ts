import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '@app/contracts';
import { admin } from 'better-auth/plugins';

export function createAuth(prisma: PrismaService) {
  return betterAuth({
    trustedOrigins: [
      process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
      process.env.CLIENT_URL ?? 'http://localhost:4173',
    ],
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60,
      },
    },
    plugins: [admin()],
    // experimental: { joins: true },
  });
}
