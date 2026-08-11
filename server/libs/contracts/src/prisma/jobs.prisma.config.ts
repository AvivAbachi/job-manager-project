import { defineConfig } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'jobs.prisma',
  migrations: { path: 'jobs-migrations' },
  datasource: { url: process.env.JOBS_DATABASE_URL },
});
