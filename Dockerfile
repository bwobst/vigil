# syntax=docker/dockerfile:1

FROM node:22-bookworm AS build

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/
COPY packages/json-extractor/package.json packages/json-extractor/

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter server exec prisma generate
RUN pnpm build
ENV CI=true
RUN pnpm prune --prod

FROM node:22-bookworm AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends caddy \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/pnpm-workspace.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/server/dist ./apps/server/dist
COPY --from=build /app/apps/server/package.json ./apps/server/package.json
COPY --from=build /app/apps/server/prisma ./apps/server/prisma
COPY --from=build /app/packages/json-extractor/dist ./packages/json-extractor/dist
COPY --from=build /app/packages/json-extractor/package.json ./packages/json-extractor/package.json
COPY --from=build /app/apps/client/dist /srv/public
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["sh", "-c", "node apps/server/dist/main.js & exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
