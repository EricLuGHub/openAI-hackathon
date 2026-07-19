FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/cloud/package.json apps/cloud/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile

COPY apps ./apps
COPY packages ./packages
RUN pnpm build

ENV NODE_ENV=production
CMD ["pnpm", "--filter", "@haderach/cloud", "start:prod"]
