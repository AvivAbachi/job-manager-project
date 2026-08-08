import { defineConfig } from 'prisma/config';
import { buildDatabaseUrl } from './libs/contracts/src/prisma/database-url';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: buildDatabaseUrl(),
  },
});
