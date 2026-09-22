FROM node:24-bookworm-slim

RUN corepack enable && corepack prepare pnpm@12.5.1 --activate

WORKDIR /workspace
