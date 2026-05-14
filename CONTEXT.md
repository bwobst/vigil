# Vigil — Domain Context

## Glossary

### Watch
The central domain concept. A Watch is a user-configured unit of observation: a target URL, an extraction definition, a condition, and a schedule. Vigil periodically fetches the target, extracts a value, evaluates the condition, and records the result. A Watch is either HTML-type (extraction via CSS selector) or JSON-type (extraction via JSONPath).

### Target
The URL a Watch fetches — either a webpage (HTML) or an API endpoint (JSON).

### Extractor
The rule that pulls a specific value out of a Target's response. For HTML Targets: a CSS selector. For JSON Targets: a JSONPath expression. When configuring a JSON Watch in the client, the form includes a local evaluator: the user pastes sample JSON and sees the extracted value (and a secondary list when multiple nodes match), using the same first-match string extraction behavior as execution. Sample text is not persisted across reloads.

### Condition
The comparison rule evaluated against the extracted value each time a Watch runs. Supported operators: equals, changed, less than, greater than. **Equals**, **less than**, and **greater than** use a fixed **expected value** supplied by the user (string equality for equals; numeric threshold for less than / greater than — interpreted leniently as a floating-point literal, including scientific notation, with surrounding whitespace ignored; the threshold must be a **finite** number when the Watch is saved). **Changed** compares the current extracted value to the previous run's extracted value and does not use an expected value — **expected value must be null** when the operator is changed (non-null values are rejected when the Watch is saved). For less than and greater than, if the extracted value cannot be interpreted as a number at run time, the condition is **not met** (the run still succeeds; there is no error solely for non-numeric extraction). When a Condition is met, the result is recorded in the Watch Run — no notification is sent. The user reviews results via the dashboard.

### Watch Run
A single execution instance of a Watch. Records start time, end time, pass/fail status, the extracted value, and whether the Condition was met. Stored in Postgres via pg-boss.

### Schedule
The cron expression that determines how frequently a Watch runs. Defined per Watch by the user. Minimum granularity: 5 minutes.

## Architecture

Vigil is a pnpm workspaces monorepo with two packages:

- **`apps/client`** — Vite + React 19 SPA, TanStack Router, shadcn/ui
- **`apps/server`** — NestJS + TypeScript, REST (`/api/*`), Prisma, pg-boss

The client communicates with the server via a REST API under `/api/*`. TanStack Query wraps a small `fetch`-based client; request/response types are defined twice — once on the server as NestJS DTOs (with `class-validator` decorators) and once on the client as hand-written TypeScript types. Drift is managed manually.

Postgres is the only datastore — used for both application data (via Prisma) and Watch scheduling/history (via pg-boss).

Each Watch owns its Schedule. When a Watch runs, pg-boss records a Watch Run with the extracted value, condition result, and pass/fail status. The client can trigger a Watch off-schedule via `POST /api/watches/:id/run`, which enqueues a pg-boss job and returns 202 — the same execution path as scheduled runs.

In production, Caddy sits in front of both, routing `/api/*` to NestJS and all other traffic to the static Vite build. In dev, Vite proxies `/api/*` to NestJS so the client uses relative URLs in both environments. No CORS configuration required.

## UI System

Vigil uses **shadcn/ui** (New York style) built on top of Tailwind CSS.

- **Base color**: zinc
- **Accent color**: emerald
- **Border radius**: rounded (default, `0.5rem` base)
- **Style variant**: New York

All UI components must use shadcn primitives where available. Raw Tailwind utilities are permitted for layout and spacing only — not for recreating components that shadcn already provides.
