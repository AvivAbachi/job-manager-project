import { betterAuth } from 'better-auth/minimal';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaService } from '@app/contracts';
import { admin } from 'better-auth/plugins';

export function createAuth(prisma: PrismaService) {
  return betterAuth({
    trustedOrigins: [
      process.env.BETTER_AUTH_URL,
      process.env.CLIENT_URL,
    ].filter((url) => url !== undefined),
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [admin()],
    // experimental: { joins: true },
  });
}
