# syntax=docker/dockerfile:1
# Web image — build context is the repo root so workspace packages are available.
FROM node:22-slim AS builder

ENV PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH" \
    CI=true
RUN corepack enable

WORKDIR /repo

# Copy manifests first for cached dependency installs.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/ui/package.json packages/ui/
COPY packages/config/package.json packages/config/
RUN pnpm install --frozen-lockfile

# Build the web app.
COPY . .
RUN pnpm --filter @nikhil-portfolio/web build

FROM node:22-slim AS runner

ENV NODE_ENV=production \
    PNPM_HOME="/pnpm" \
    PATH="/pnpm:$PATH"
RUN corepack enable

WORKDIR /repo
COPY --from=builder /repo ./

WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
