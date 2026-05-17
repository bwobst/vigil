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
RUN pnpm --filter server deploy --prod --legacy /prod/server
RUN cd /prod/server && npx --yes prisma@6.19.3 generate

FROM node:22-bookworm AS runtime

RUN apt-get update \
  && apt-get install -y --no-install-recommends caddy \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g prisma@6.19.3

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /prod/server/dist ./apps/server/dist
COPY --from=build /prod/server/node_modules ./apps/server/node_modules
COPY --from=build /prod/server/package.json ./apps/server/package.json
COPY --from=build /prod/server/prisma ./apps/server/prisma
COPY --from=build /app/apps/client/dist /srv/public
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["sh", "-c", "node apps/server/dist/main.js & exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile"]
