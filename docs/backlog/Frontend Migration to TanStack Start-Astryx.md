---
tags: [backlog, frontend, migration, tanstack]
status: todo
priority: high
created: 2026-07-26
---

# Frontend Migration to TanStack Start / Astryx

## Goal

Migrate all frontend applications in the monorepo to [[TanStack Start]]. Use [[Astryx]] as the deployment and runtime target.

## Current State

- Frontends use a mix of frameworks. You need an audit.
- The monorepo has no unified routing, data fetching, or SSR strategy.

## Target State

- All frontends run on TanStack Start (React-based full-stack framework).
- Astryx serves as the deployment platform.
- TanStack Router provides unified routing.
- TanStack Query provides unified data fetching.
- The system uses SSR where beneficial.

## Plan

1. **Audit**: List all frontend apps and packages in the monorepo.
2. **Prioritize**: Pick the simplest frontend as the migration pilot.
3. **Pilot migration**:
   - Scaffold a new TanStack Start project.
   - Port the routes one by one.
   - Port the data fetching to TanStack Query.
   - Verify the feature parity.
   - Deploy the pilot to Astryx.
4. **Repeat** for each remaining frontend.
5. **Remove** old framework dependencies from the monorepo.

## Open Questions

- Which frontends exist? You need a full audit first.
- Is Astryx ready for production workloads at our scale?
- Do we need SSR for all routes? Can some routes stay client-only?
- What is the auth story with TanStack Start?

## Related

- [[Package Cleanup — Remove Dead Packages]] (frontend deps may be cleaned)
- [[Playwright Testing — Frontends]] (add tests during migration)
