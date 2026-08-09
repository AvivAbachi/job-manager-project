# Job Manager web client

React/Vite client for the Job Manager gateway. It provides cookie-backed Better Auth registration and sign-in, member job creation and tracking, and administrator job oversight. Notification UI and notification API calls are intentionally excluded.

## Local development

Prerequisites: Node 26 and pnpm 11. Start the API gateway on port `3001`, then run:

```bash
pnpm install
pnpm dev
```

The client runs at `http://localhost:4173`. Requests to `/api/auth` and `/job` remain same-origin in the browser and are proxied to `API_PROXY_TARGET`, which defaults to `http://localhost:3001`.

To use a different gateway in PowerShell:

```powershell
$env:API_PROXY_TARGET = 'http://localhost:3000'
pnpm dev
```

The public client origin must also be accepted by the gateway's Better Auth trusted-origin configuration.

## Build and preview

```bash
pnpm generate-routes
pnpm build
pnpm preview
```

Preview serves on port `4173` and uses the same proxy target setting.

## Container

```bash
docker build -t job-manager-client .
docker run --rm -p 4173:4173 -e CLIENT_PORT=4173 -e API_PROXY_TARGET=http://host.docker.internal:3001 job-manager-client
```

`CLIENT_PORT` controls the container's listening port; publish the same port or map it explicitly. `API_PROXY_TARGET` must be reachable from inside the container (use a Compose service name when applicable). Keep the client and API on distinct ports.

## Verification

```bash
pnpm generate-routes
pnpm build
pnpm lint
pnpm check
```

No automated tests are added by this change. Complete the documented OpenSpec manual flows against a running gateway.
