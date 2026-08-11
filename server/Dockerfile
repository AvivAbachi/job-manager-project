FROM node:26-alpine AS base

RUN npm install --global pnpm@11

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile


# Stage 1: Build the requested app
FROM base AS build

ARG APP

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY apps ./apps
COPY libs ./libs

RUN pnpm exec prisma generate --schema libs/contracts/prisma/auth.prisma \
  && pnpm exec prisma generate --schema libs/contracts/prisma/jobs.prisma

RUN test -n "$APP" && pnpm exec nest build "$APP"


# Stage 2: Production deps
FROM node:26-alpine AS prod

RUN npm install --global pnpm@11

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --prod --frozen-lockfile


# Stage 3: Runtime
FROM node:26-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

ARG APP

COPY --chown=node:node --from=prod /app/node_modules ./node_modules
COPY --chown=node:node --from=build /app/dist/apps/${APP} ./dist

USER node

CMD ["node", "dist/main.js"]
