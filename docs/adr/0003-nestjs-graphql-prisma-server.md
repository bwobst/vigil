# ADR 0003: NestJS + GraphQL (code-first) + Prisma as the server stack

**Status**: Accepted  
**Date**: 2026-05-07

## Context

Vigil needs a server that exposes data to the React client and runs background jobs. The server must be TypeScript-native and integrate cleanly with the existing client toolchain.

## Decision

- **Framework**: NestJS — TypeScript-first, decorator-based, structured module system
- **API**: GraphQL via `@nestjs/graphql`, code-first approach — TypeScript decorators generate the schema, no hand-written SDL
- **ORM**: Prisma — schema file drives migrations and type-safe queries
- **Database**: PostgreSQL
- **Client fetching**: TanStack Query + `graphql-request` in `apps/client`
- **Type sync**: GraphQL Code Generator pointed at the NestJS-emitted schema, generating types into `apps/client/src/gql/`

## Alternatives considered

- **Schema-first GraphQL** — rejected; code-first eliminates SDL/resolver drift and keeps TypeScript as the single source of truth
- **TypeORM instead of Prisma** — rejected; Prisma's DX (migrations, type safety, query builder) is significantly better in practice
- **REST instead of GraphQL** — rejected; GraphQL's typed schema enables codegen-driven client types without manual coordination
- **Apollo Client on the frontend** — rejected; TanStack Query is already in the stack and avoids introducing a second cache layer

## Consequences

- NestJS emits a `schema.graphql` file at build time; codegen must run after server build
- Prisma migrations live in `apps/server/prisma/migrations/`
- All client–server data contracts flow through the GraphQL schema — no ad-hoc REST endpoints
