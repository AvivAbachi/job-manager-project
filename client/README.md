<h1 align="center">Job Manager Client</h1>

<p align="center">The React interface for registering, managing jobs, tracking progress, and administering users.</p>

## Stack

- React 19 and TypeScript
- Vite 8
- TanStack Router (file-based routes), Query, and Form
- Better Auth client
- Astryx Design with StyleX styling

## Getting started

The complete application is easiest to run from the [repository root](../README.md) with Docker Compose. For client-only development:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The development server listens on [http://localhost:4173](http://localhost:4173). It expects the backend API to be reachable through Vite's configured proxy; run the server stack alongside it.

## Commands

| Command                | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `pnpm dev`             | Start the Vite development server on port 4173 |
| `pnpm build`           | Type-check and create a production build       |
| `pnpm preview`         | Serve the production build on port 4173        |
| `pnpm lint`            | Run ESLint                                     |
| `pnpm check`           | Check formatting with Prettier                 |
| `pnpm generate-routes` | Regenerate TanStack Router route definitions   |

## Routes and behaviour

The app includes public sign-in and registration pages plus authenticated job and admin areas:

- `/jobs` — job list with status filtering, sorting, pagination, and polling while work is active.
- `/jobs/$jobId` — job details and current progress.
- `/admin` and `/admin/users` — administrative views for users with the required permissions.

API calls live in [`src/lib/api.ts`](./src/lib/api.ts); route definitions live in [`src/routes`](./src/routes). Generated router output is stored in `src/routeTree.gen.ts`.

> [!TIP]
> After adding or renaming a file-based route, run `pnpm generate-routes` before committing so the generated route tree stays current.

## Production container

The [Dockerfile](./Dockerfile) creates a Vite production build and serves it with `vite preview` on port `4173`. In the Docker Compose environment it is exposed to the host as [http://localhost:8080](http://localhost:8080) and proxies API traffic to the gateway container.
