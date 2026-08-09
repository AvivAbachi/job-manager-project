# Job Manager

A resilient, asynchronous job-processing service built with NestJS. Clients submit work through an authenticated HTTP API; the service records it in PostgreSQL, dispatches it through Redis-backed BullMQ queues, and reports its lifecycle as `PENDING`, `ACTIVE`, `COMPLETED`, or `FAILED`.

## Highlights

- Authenticated, user-scoped job API with an admin-only job listing.
- Idempotent job submission using an `Idempotency-Key` header and a database uniqueness constraint.
- Background processing with three attempts per job and rate-limited workers.
- Transactional outbox recovery: jobs persisted before a crash are re-enqueued when the job service starts.
- NestJS built-in logging and an aggregate health endpoint.

## Architecture

```text
Client
  │ HTTP :3000
  ▼
API gateway ──TCP──► Job service :3001 ──► PostgreSQL
  │                         │
  │                         ▼
  └──TCP──► Notification :3002       Redis / BullMQ
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
                    Job worker              Notification worker
```

| Component                              | Responsibility                                                             |
| -------------------------------------- | -------------------------------------------------------------------------- |
| `api-gateway`                          | HTTP API, Better Auth sessions, authorization, and health aggregation.     |
| `job`                                  | Owns job persistence, idempotency, outbox recovery, and queue publication. |
| `job-worker`                           | Executes queued job stages and updates job status.                         |
| `notification` / `notification-worker` | Notification microservice and its independently scalable queue worker.     |
| `contracts`                            | Shared Prisma client, TypeScript contracts, and logging setup.             |

The Job service stores a job and its outbox record in one database transaction. It then adds the job to BullMQ and removes the outbox record. On startup, it reconciles queue records with outstanding outbox rows and re-enqueues pending work, closing the gap between a successful database write and a process crash before queue publication.

## Prerequisites

- Node.js 26 (the Docker image uses `node:26-alpine`)
- pnpm 11+
- PostgreSQL
- Redis

## Quick start

1. Install dependencies and copy or create `.env`:

   ```bash
   pnpm install
   ```

2. Configure the required environment variables. Keep credentials out of source control.

   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USER=job_manager
   DATABASE_PASSWORD=replace-with-a-strong-password
   DATABASE_NAME=job_manager
   BETTER_AUTH_SECRET=replace-with-a-long-random-secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

   `DATABASE_HOST` and `DATABASE_PORT` default to `localhost` and `5432`. Redis defaults to `localhost:6379`; override it with `REDIS_HOST` and `REDIS_PORT` when needed.

3. Create the database schema and generate the Prisma client:

   ```bash
   pnpm exec prisma migrate dev
   pnpm exec prisma generate
   ```

4. Start each process in a separate terminal:

   ```bash
   pnpm exec nest start api-gateway --watch
   pnpm exec nest start job --watch
   pnpm exec nest start job-worker --watch
   pnpm exec nest start notification --watch
   pnpm exec nest start notification-worker --watch
   ```

   The gateway listens on port `3000`, the Job TCP service on `3001`, and the Notification TCP service on `3002`. Set `PORT`, `JOB_HOST` / `JOB_PORT`, and `NOTIFICATION_HOST` / `NOTIFICATION_PORT` to change them.

> [!NOTE]
> Job endpoints require a Better Auth session. Register and sign in via the auth routes provided by Better Auth before calling them; the API expects the resulting session cookie.

## HTTP API

| Method | Route      | Access        | Description                                                       |
| ------ | ---------- | ------------- | ----------------------------------------------------------------- |
| `GET`  | `/health`  | Public        | Checks the Job and Notification services (5-second timeout each). |
| `GET`  | `/job`     | Authenticated | Lists the current user's jobs, newest first.                      |
| `GET`  | `/job/:id` | Authenticated | Retrieves one of the current user's jobs.                         |
| `POST` | `/job`     | Authenticated | Creates, or safely repeats, a job submission.                     |
| `GET`  | `/job/all` | Admin         | Lists all jobs.                                                   |

Create a job with a GUID `Idempotency-Key`. Reusing the key with identical content returns the existing job; reusing it with different content returns a conflict.

```bash
curl -X POST http://localhost:3000/job \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000' \
  -H 'Cookie: better-auth.session_token=…' \
  -d '{"totalStages": 5, "totalTime": 10000, "failStage": null}'
```

`totalTime` is in milliseconds. `failStage` can be set to a zero-based stage index to exercise retry and failure behavior.

## Job lifecycle and reliability

1. A submission creates a `PENDING` job and its outbox record atomically.
2. BullMQ queues the work; workers process no more than 20 jobs per 10 seconds per worker instance.
3. When work starts, finishes, or exhausts its three attempts, the worker records `ACTIVE`, `COMPLETED`, or `FAILED` in PostgreSQL.
4. Completed queue entries are removed. Pending outbox records are reconciled at service startup, allowing safe recovery after interrupted publication.

Jobs are indexed by user and status, and the `(userId, idempotency key)` uniqueness constraint makes duplicate requests safe. Redis/BullMQ permits workers to scale horizontally; increase worker replicas to absorb bursts while keeping the configured limiter aligned with downstream capacity. For higher sustained volume, run PostgreSQL and Redis as managed, highly available services, monitor queue depth and retry rates, and add partitioning or archival policies as job history grows.

## Development

```bash
pnpm run build
pnpm run test
pnpm run test:cov
pnpm run lint
```

Build a production image for one application by supplying its Nest project name:

```bash
docker build --build-arg APP=api-gateway -t job-manager-api .
```
