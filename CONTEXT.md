# Vigil — Domain Context

## Glossary

### Watch
The central domain concept. A Watch is a user-configured unit of observation: a target URL, an extraction definition, a condition, and a schedule. Vigil periodically fetches the target, extracts a value, evaluates the condition, and records the result. A Watch is either HTML-type (extraction via CSS selector) or JSON-type (extraction via JSONPath).

### Target
The URL a Watch fetches — either a webpage (HTML) or an API endpoint (JSON).

### Extractor
The rule that pulls a specific value out of a Target's response. For HTML Targets: a CSS selector. For JSON Targets: a JSONPath expression.

### Condition
The comparison rule evaluated against the extracted value each time a Watch runs. Supported operators: equals, changed, less than, greater than. A Condition may reference a fixed expected value (equals "available") or compare against the previous run's value (changed, less than, greater than). When a Condition is met, the result is recorded in the Watch Run — no notification is sent. The user reviews results via the dashboard.

### Watch Run
A single execution instance of a Watch. Records start time, end time, pass/fail status, the extracted value, and whether the Condition was met. Stored in Postgres via pg-boss.

### Schedule
The cron expression that determines how frequently a Watch runs. Defined per Watch by the user. Minimum granularity: 5 minutes.

## Architecture

Vigil is a pnpm workspaces monorepo with two packages:

- **`apps/client`** — Vite + React 19 SPA, TanStack Router, shadcn/ui
- **`apps/server`** — NestJS + TypeScript, GraphQL (code-first), Prisma, pg-boss

The client communicates with the server exclusively via GraphQL (`/graphql`). TanStack Query + `graphql-request` handle data fetching on the client. GraphQL Code Generator keeps client types in sync with the server schema.

Postgres is the only datastore — used for both application data (via Prisma) and Watch scheduling/history (via pg-boss).

Each Watch owns its Schedule. When a Watch runs, pg-boss records a Watch Run with the extracted value, condition result, and pass/fail status. The client can trigger a Watch off-schedule via a "run now" action.

In production, Caddy sits in front of both, routing `/graphql` to NestJS and all other traffic to the static Vite build. No CORS configuration required.

## UI System

Vigil uses **shadcn/ui** (New York style) built on top of Tailwind CSS.

- **Base color**: zinc
- **Accent color**: emerald
- **Border radius**: rounded (default, `0.5rem` base)
- **Style variant**: New York

All UI components must use shadcn primitives where available. Raw Tailwind utilities are permitted for layout and spacing only — not for recreating components that shadcn already provides.
