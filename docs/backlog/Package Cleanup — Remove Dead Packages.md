---
tags: [backlog, cleanup, packages, monorepo]
status: todo
priority: high
created: 2026-07-26
---

# Package Cleanup — Remove Dead Packages

## Goal

Delete packages that are unused, barely used, or redundant. Reduce monorepo surface area.

## Candidates

| Package | Reason | Action |
|---------|--------|--------|
| `hono-middleware` | Used only once — inline it | Delete package, move logic to consumer |
| `intl` | Replace entirely with project constants | Delete package, add constants file |
| `monorepo-tools` | Remove entirely | Delete package, remove CI references |
| `service-worker` | Used only once — inline it | Delete package, move logic to consumer |
| `telemetry` | Remove entirely | Delete package, remove all imports |

## Plan

### For each "used only once" package (hono-middleware, service-worker)

1. Identify the single consumer
2. Copy the relevant logic into the consumer's codebase
3. Update the consumer's imports
4. Verify tests pass
5. Delete the package directory
6. Run full monorepo build + test

### For each "remove entirely" package (intl, monorepo-tools, telemetry)

1. Find all imports across the monorepo
2. Replace intl usage with project-local constants
3. Remove monorepo-tools from CI scripts, lint configs, and tooling
4. Strip telemetry calls from all code paths
5. Delete each package directory
6. Run full monorepo build + test

### Cleanup order

1. `telemetry` (no dependencies on other candidates)
2. `intl` (may depend on nothing else being removed)
3. `monorepo-tools` (CI impact — do last among "remove entirely")
4. `hono-middleware` (consumer migration)
5. `service-worker` (consumer migration)

## Verification

- `pnpm -r test` passes
- `pnpm -r build` passes
- `pnpm -r lint` passes
- No imports remain pointing to deleted packages (`rg "from ['\"]@ethang/(hono-middleware|intl|monorepo-tools|service-worker|telemetry)"` returns empty)

## Risks

- `monorepo-tools` removal may break CI — audit all CI configs first
- `telemetry` may be deeply embedded — grep exhaustively
- Order matters — remove in the listed sequence to avoid cascade failures
