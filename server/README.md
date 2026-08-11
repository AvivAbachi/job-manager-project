# Job Manager Server

NestJS services for authentication, HTTP access, durable job orchestration, and background processing.

## Services

| Service       | Default port | Responsibility                                                      |
| ------------- | ------------ | ------------------------------------------------------------------- |
| API gateway   | 3000         | Authenticated HTTP API, health endpoint, and Better Auth proxy      |
| Job service   | 3001         | Job persistence, queries, and queue requests over TCP               |
| Auth service  | 3002         | Better Auth, PostgreSQL adapter, and Redis-backed secondary storage |
| Job scheduler | —            | Moves transactional outbox records to BullMQ                        |
| Job worker    | —            | Executes queued jobs and records status/progress                    |

Shared TypeScript contracts and Prisma schemas live in `libs/contracts`.

## Local development

### Prerequisites

- Node.js 26
- pnpm 11
- PostgreSQL databases for auth and jobs
- Redis instances for authentication and BullMQ

From this directory, install dependencies and start all Nest applications in watch mode:

```sh
pnpm install --frozen-lockfile
pnpm start:dev
```

The recommended way to provide all dependencies is the [root Docker Compose setup](../README.md#quick-start). Copy the root environment template first and make sure its host/port values match the locally running services.

> [!IMPORTANT]
> Generate Prisma clients and apply migrations before using the services against fresh databases.

```sh
pnpm prisma:generate
pnpm prisma:migrate:deploy
```

## Commands

| Command                      | Description                                                 |
| ---------------------------- | ----------------------------------------------------------- |
| `pnpm start:dev`             | Run auth, gateway, job, scheduler, and worker in watch mode |
| `pnpm start`                 | Run all services without watch mode                         |
| `pnpm start:debug`           | Run all services with debugging enabled                     |
| `pnpm start:prod`            | Run the compiled services                                   |
| `pnpm build`                 | Build every Nest application                                |
| `pnpm prisma:generate`       | Generate both Prisma clients                                |
| `pnpm prisma:migrate:deploy` | Deploy auth and jobs migrations                             |
| `pnpm test`                  | Run Jest tests                                              |
| `pnpm test:cov`              | Run tests with coverage                                     |
| `pnpm lint`                  | Run ESLint with automatic fixes                             |

## Data flow

1. The gateway validates the current session with the auth service and forwards job requests to the job service.
2. The job service writes a job and its outbox record transactionally in the jobs database.
3. The scheduler reads unprocessed outbox records and bulk-adds jobs to the BullMQ queue.
4. The worker updates progress and persists the final `COMPLETED` or `FAILED` status.

This outbox step prevents jobs from being lost if the service writes to PostgreSQL but cannot immediately publish to Redis.

## Environment

The root [`.env.exmple`](../.env.exmple) is the canonical variable template. Local service execution reads it via `start-script.js`.

| Group             | Variables                                                                      |
| ----------------- | ------------------------------------------------------------------------------ |
| Service addresses | `API_PORT`, `JOB_PORT`, `AUTH_PORT`, `JOB_HOST`, `AUTH_HOST`                   |
| Auth              | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_URL`                          |
| Redis             | `REDIS_AUTH_HOST`, `REDIS_AUTH_PORT`, `REDIS_BULLMQ_HOST`, `REDIS_BULLMQ_PORT` |
| Databases         | `AUTH_DATABASE_URL`, `JOBS_DATABASE_URL`                                       |

## Container image

The [Dockerfile](./Dockerfile) builds a selected Nest app using `--build-arg APP=<service>`, generates both Prisma clients, and produces a production image. Docker Compose builds individual images for the API gateway, auth service, job service, scheduler, and worker.
