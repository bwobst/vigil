# ADR 0002: pnpm workspaces monorepo with apps/client and apps/server

**Status**: Accepted  
**Date**: 2026-05-07

## Context

Vigil needs a server alongside the existing Vite + React client. The two packages have different build tools, runtimes, and dependency graphs. They need to coexist in one repo without interfering with each other.

## Decision

Convert to a **pnpm workspaces monorepo** with the following layout:

```
/
├── apps/
│   ├── client/   # Vite + React SPA (formerly src/)
│   └── server/   # NestJS API
├── pnpm-workspace.yaml
└── package.json  # root — workspace scripts only
```

## Alternatives considered

- **Turborepo on top of pnpm workspaces** — rejected; adds meaningful complexity for two packages. Can be added later if build caching becomes valuable.
- **Flat repo with colocated server/** — rejected; sharing one `package.json` across Vite and NestJS creates build config conflicts and dependency pollution.
- **Separate repos** — rejected; shared types and coordinated deploys are simpler in one repo.

## Consequences

- Each app owns its own `package.json`, `tsconfig.json`, and build pipeline
- Root `package.json` contains only workspace-level scripts (e.g. `dev`, `build`, `test` that delegate to both apps)
- GraphQL Code Generator runs in `apps/client` pointed at the schema emitted by `apps/server`
