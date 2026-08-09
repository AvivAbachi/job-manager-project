FROM ghcr.io/pnpm/pnpm:11 AS build
RUN pnpm runtime set node 26 -g
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

ENV CLIENT_PORT=4173
ENV API_PROXY_TARGET=http://host.docker.internal:3001
EXPOSE 4173
CMD ["sh", "-c", "pnpm exec vite preview --host 0.0.0.0 --port ${CLIENT_PORT}"]
