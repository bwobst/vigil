# ADR 0001: Use shadcn/ui (New York, zinc/emerald) as the component system

**Status**: Accepted  
**Date**: 2026-05-07

## Context

Vigil launched with raw Tailwind utility classes hand-rolled across every component. As the UI grows, this creates inconsistency and maintenance overhead — every card, button, and nav item is a bespoke Tailwind string.

## Decision

Add **shadcn/ui** on top of Tailwind CSS. Configuration:

- Style: **New York** (tighter padding, stronger shadows — more polished out of the box)
- Base color: **zinc** (clean, slightly warm neutral)
- Accent color: **emerald** (fresh, distinct from the generic indigo default)
- Border radius: **rounded** (default `0.5rem` — approachable without being soft)

Replace all hand-rolled Tailwind components with shadcn equivalents. Raw Tailwind is permitted for layout and spacing only.

## Alternatives considered

- **Keep raw Tailwind** — rejected; no consistency guarantees as the UI grows
- **Different accent (indigo)** — rejected; emerald gives Vigil a more distinctive identity
- **Sharp corners** — rejected; felt cold against the zinc + emerald palette
- **Default style** — rejected; New York looks more polished with minimal page content

## Consequences

- All new UI components must use shadcn primitives where one exists
- shadcn components are copied into `src/components/ui/` and are owned by this repo — they can be customized freely
- Tailwind remains a direct dependency; removing it would break shadcn
