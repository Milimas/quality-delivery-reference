FROM node:24-bookworm-slim AS dependencies

RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/pricing/package.json apps/pricing/package.json
RUN pnpm install --frozen-lockfile --prod --filter @quality-reference/pricing

FROM node:24-bookworm-slim AS runtime

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack
WORKDIR /workspace

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/pricing/node_modules apps/pricing/node_modules
COPY tsconfig.base.json ./
COPY apps/pricing apps/pricing

USER node
ENV HOST=0.0.0.0 PORT=3001
EXPOSE 3001
CMD ["node", "apps/pricing/src/index.ts"]
