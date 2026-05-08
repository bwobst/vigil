# ADR 0004: pg-boss for Watch scheduling and run history

**Status**: Accepted  
**Date**: 2026-05-07

## Context

Vigil runs user-defined Watches on arbitrary cron Schedules (minimum 5-minute granularity). Requirements:
- Per-Watch Schedules stored persistently
- Per-Watch Run history: start time, end time, pass/fail status, extracted value, condition result
- Manual "run now" trigger independent of Schedule
- Single user, tens of Watches — no scale pressure

## Decision

Use **pg-boss** on top of the existing Postgres instance. Watch definitions and Watch Run history live in Postgres. NestJS loads Watch definitions on startup and registers them with pg-boss. The `@nestjs/schedule` `SchedulerRegistry` is not used — pg-boss owns all scheduling.

## Alternatives considered

- **`@nestjs/schedule` with `SchedulerRegistry`** — rejected; no built-in run history or manual trigger. Would require building Watch Run persistence and history from scratch.
- **BullMQ + Redis** — rejected; Redis is additional infrastructure. At this scale (single user, tens of Watches, 5-minute minimum interval), the operational complexity is not justified.
- **pg-boss on Postgres** — accepted; Postgres-only keeps the infrastructure surface minimal. pg-boss provides run history, pass/fail tracking, return data storage, and `sendNow()` for off-schedule execution out of the box.

## Consequences

- Postgres hosts both application data (Prisma) and Watch queue (pg-boss) — two separate schema managers in one database
- Watch Run history is queryable via GraphQL (exposed through NestJS resolvers over pg-boss tables)
- Manual "run now" maps to `pg-boss.sendNow(watchId)`
- If Watch volume or reliability requirements grow significantly, BullMQ + Redis is the upgrade path
