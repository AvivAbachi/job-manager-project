import 'dotenv/config';

export function buildDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const missing = [
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
  ].filter((name) => !env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}`,
    );
  }

  const host = env.DATABASE_HOST ?? 'localhost';
  const port = env.DATABASE_PORT ?? '5432';

  return `postgresql://${encodeURIComponent(env.DATABASE_USER!)}:${encodeURIComponent(env.DATABASE_PASSWORD!)}@${host}:${port}/${encodeURIComponent(env.DATABASE_NAME!)}`;
}
