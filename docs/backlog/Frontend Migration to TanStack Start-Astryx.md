---
tags: [backlog, frontend, migration, tanstack]
status: todo
priority: high
created: 2026-07-26
---

# Frontend Migration to TanStack Start / Astryx

## Goal

Migrate all frontend applications in the monorepo to [[TanStack Start]] with [[Astryx]] as the deployment/runtime target.

## Current State

- Frontends use a mix of frameworks (audit needed)
- No unified routing, data fetching, or SSR strategy

## Target State

- All frontends on TanStack Start (React-based full-stack framework)
- Astryx as the deployment platform
- Unified routing via TanStack Router
- Unified data fetching via TanStack Query
- SSR where beneficial

## Plan

1. **Audit**: List all frontend apps/packages in the monorepo
2. **Prioritize**: Pick the simplest frontend as the migration pilot
3. **Pilot migration**:
   - Scaffold new TanStack Start project
   - Port routes one-by-one
   - Port data fetching to TanStack Query
   - Verify feature parity
   - Deploy pilot to Astryx
4. **Repeat** for each remaining frontend
5. **Remove** old framework dependencies from monorepo

## Open Questions

- Which frontends exist? Need full audit first
- Is Astryx ready for production workloads at our scale?
- Do we need SSR for all routes, or can some stay client-only?
- What's the auth story with TanStack Start?

## Related

- [[Package Cleanup — Remove Dead Packages]] (frontend deps may be cleaned)
- [[Playwright Testing — Frontends]] (add tests during migration)
