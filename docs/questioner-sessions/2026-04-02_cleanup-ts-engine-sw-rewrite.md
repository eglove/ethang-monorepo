# Briefing: Cleanup — TS Engine Removal & Service Worker Rewrite

**Date:** 2026-04-02
**Status:** SIGNED OFF
**Pipeline Run:** Yes

---

## Topic

Three cleanup tasks: remove the dead TypeScript pipeline engine, confirm bun CLI refs are a no-op, and completely rewrite the service workers for both Hono apps.

## Scope

### In Scope

- Deleting TS engine code from `packages/design-pipeline/src/`
- Cleaning up `packages/design-pipeline/package.json`
- Complete from-scratch rewrite of both service worker files
- Preserving all existing SW behavioral requirements

### Out of Scope

- Modifying docs/ markdown files (preserved as historical records)
- Changing skill-tests (they are independent of the engine)
- Bun CLI references (confirmed no-op — zero refs in agent files)

---

## Task 1: TS Pipeline Removal

### What to Delete

From `packages/design-pipeline/src/`:
- `engine/` — pipeline-engine, pipeline-runner, state-store, validator (+ tests)
- `state-machine/` — pipeline-lifecycle, pipeline-phases, pipeline-state, step-lifecycle (+ tests)
- `contracts/` — Zod schemas for all agents + shared schemas
- `bin.ts` — CLI entry point
- `index.ts` — re-exports from all directories

### What to Keep

- `skill-tests/` — 17 test files that validate skill/agent YAML/markdown structure via `readFileSync`. Zero imports from deleted code.
- `docs/` markdown files — historical design records

### Package.json Cleanup

- Remove `bin` field (points to deleted `bin.ts`)
- Remove dead scripts referencing the engine
- Remove unused dependencies that only the deleted modules needed (e.g., `zod`, `xstate`, bun types)

### Acceptance Criteria

- Listed directories and files are deleted
- `skill-tests/` still pass (`vitest`)
- `package.json` has no references to removed code
- No broken imports across the monorepo

---

## Task 2: Bun CLI References — NO-OP

Zero bun references exist in agent SKILL.md/AGENT.md files. The only bun references are in `docs/` markdown files which are preserved as historical records. No action required.

---

## Task 3: Service Worker Rewrite

### Files to Rewrite

- `apps/ethang-hono/public/sw.js`
- `apps/sterett-hono/public/sw.js`

### Behavioral Requirements (must be preserved)

1. **Stale-while-revalidate** for all requests — serve from cache immediately, fetch from network in background
2. **Last-Modified comparison** — compare `Last-Modified` header between cached and network responses to detect content changes
3. **Silent page reload** — when content differs, post `CONTENT_UPDATED` message; client JS calls `location.reload()` silently (no toast or prompt)
4. **ethang-hono link-precaching** — client sends `PRECACHE_LINKS` message with URLs extracted from page links; SW caches them proactively
5. **sterett-hono NAV_ROUTES precache** — predefined navigation routes precached at SW install time
6. **stamp-sw.ts cache-busting** — SHA hash injected into SW file for versioning

### Preserved As-Is

- `scripts/stamp-sw.ts` in both apps
- Client-side SW registration JS in layout files (may be rewritten to match new SW API if needed)

### Acceptance Criteria

- Both SW files are clean rewrites (no legacy code carried over)
- All 6 behavioral requirements above are met
- `stamp-sw.ts` still functions correctly
- Registration code in layout files works with new SWs
- Pages served from cache load instantly; background revalidation updates content silently

### Open for Expert Debate

The implementation approach is intentionally left open for Stage 2. The expert debate should determine:
- Error handling strategy (network failures, cache misses)
- Cache naming conventions and versioning approach
- Update flow details (race conditions, partial updates)
- Whether the precaching approaches should be unified or remain app-specific
- Any modern SW patterns that improve on the current approach while preserving behavior

User defers to expert consensus on implementation specifics.

---

## Constraints

- docs/ files are never deleted (historical record)
- skill-tests are independent of the TS engine and must remain passing
- SW behavior must match current behavior from the user's perspective
- Expert debate may propose different implementation approaches — user will accept consensus

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Delete contracts/ | Skill-tests have zero imports from contracts — confirmed by grep |
| Leave docs/ | Historical records, not active agent definitions |
| Task 2 is no-op | Zero bun refs in agent files |
| Use Last-Modified (not custom header) | Current approach works, user just wants cleaner code |
| Silent reload (no toast) | Current UX is acceptable |
