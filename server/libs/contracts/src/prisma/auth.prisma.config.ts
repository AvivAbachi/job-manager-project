import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'auth.prisma',
  migrations: { path: 'auth-migrations' },
  datasource: { url: process.env.AUTH_DATABASE_URL },
});
