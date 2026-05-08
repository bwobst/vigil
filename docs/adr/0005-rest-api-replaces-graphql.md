# ADR 0005: REST API replaces GraphQL

**Status**: Accepted  
**Date**: 2026-05-08

## Context

[ADR-0003](./0003-nestjs-graphql-prisma-server.md) chose code-first GraphQL with `@nestjs/graphql` on the server and GraphQL Code Generator + `graphql-request` on the client. In practice, the GraphQL setup did not work reliably and debugging it was consuming time disproportionate to the size of the API surface (two resolvers, ~55 lines; one `.graphql` document, ~89 lines; seven generated hooks).

The original justification for GraphQL was codegen-driven type sync between server and client. That benefit did not materialize because the codegen pipeline itself was the source of the friction.

## Decision

Replace GraphQL with a REST API.

- **Transport**: REST under `/api/*`. Nested resources: `GET/POST /api/watches`, `GET/PATCH/DELETE /api/watches/:id`, `POST /api/watches/:id/run`, `GET /api/watches/:id/runs`.
- **Server contracts**: NestJS controllers + DTO classes with `class-validator` decorators. `ValidationPipe` (`whitelist: true, transform: true`) enforces them globally.
- **Client contracts**: Hand-written TypeScript types in `apps/client/src/api/types.ts`, defined independently of the server DTOs. Drift is managed manually.
- **Client fetching**: A thin `fetch` wrapper (`apps/client/src/api/client.ts`) returns parsed JSON or throws a single `ApiError` carrying `status` and `message`. TanStack Query hooks live alongside the per-resource fetch functions (`watches.ts`, `watchRuns.ts`).
- **Payload shape**: Flat JSON objects mirroring the Prisma row — no nested `target` / `extractor` / `condition` sub-objects.
- **Errors**: NestJS default exception filter (`{ statusCode, message, error }`). No custom envelope.
- **Run-now semantics**: `POST /api/watches/:id/run` enqueues a pg-boss job and returns `202 Accepted` with no body. All Watch executions — scheduled and on-demand — go through pg-boss.
- **Routing**: Caddy routes `/api/*` to NestJS in production. Vite proxies `/api/*` to NestJS in dev. Client uses relative URLs in both environments. No CORS configuration.

## Alternatives considered

- **Keep GraphQL and continue debugging** — rejected; the debugging cost had no clear endpoint and the benefits were not being realized.
- **REST alongside GraphQL (strangler migration)** — rejected; the codebase is small enough that maintaining two API styles costs more than a clean cutover.
- **OpenAPI + client codegen** — rejected; reintroduces the codegen step that was the original source of friction.
- **Zod schemas in a shared package as the single source of truth** — rejected in favor of parallel definitions, accepting manual drift management as the simpler trade-off for a 2-entity API.
- **Synchronous `POST /run` returning the completed `WatchRun`** — rejected; would create a second execution path for Watches and tie HTTP request lifetime to fetch+extract latency.

## Consequences

- ADR-0003 is superseded; `@nestjs/graphql`, `graphql-request`, GraphQL Code Generator, and the `apps/client/src/gql/` tree are removed.
- Server and client type definitions are maintained in parallel. Adding a field to a `Watch` requires touching the Prisma schema, the server DTO, and the client type. Drift surfaces at runtime as a 400 (validation) or as a missing field in the UI.
- The Caddyfile route `/graphql` is replaced with `/api/*`. Vite config gains a `server.proxy` entry for `/api`.
- Service-level tests (`watch.service.spec.ts`, `watch-run.service.spec.ts`) survive unchanged — they exercise domain logic and are transport-agnostic. No controller-level tests are added as part of this migration.
- The "no ad-hoc REST endpoints" rule from ADR-0003 no longer applies; REST *is* the API.
