FROM node:24-bookworm-slim AS dependencies

RUN corepack enable && corepack prepare pnpm@12.5.1 --activate
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/orders/package.json apps/orders/package.json
RUN pnpm install --frozen-lockfile --prod --filter @quality-reference/orders

FROM node:24-bookworm-slim AS runtime

RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack
WORKDIR /workspace

COPY --from=dependencies /workspace/node_modules ./node_modules
COPY --from=dependencies /workspace/apps/orders/node_modules apps/orders/node_modules
COPY tsconfig.base.json ./
COPY apps/orders apps/orders

USER node
ENV HOST=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["node", "apps/orders/src/index.ts"]
