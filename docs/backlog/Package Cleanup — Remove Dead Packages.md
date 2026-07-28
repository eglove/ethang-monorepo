---
tags: [backlog, cleanup, packages, monorepo]
status: todo
priority: high
created: 2026-07-26
---

# Package Cleanup — Remove Dead Packages

## Goal

Delete unused, barely used, or redundant packages. Reduce the monorepo surface area.

## Candidates

| Package | Reason | Action |
|---------|--------|--------|
| `hono-middleware` | Used only once — inline it | Delete the package. Move the logic to the consumer. |
| `intl` | Replace entirely with project constants | Delete the package. Add a constants file. |
| `monorepo-tools` | Remove entirely | Delete the package. Remove the CI references. |
| `service-worker` | Used only once — inline it | Delete the package. Move the logic to the consumer. |
| `telemetry` | Remove entirely | Delete the package. Remove all imports. |

## Plan

### For each "used only once" package (hono-middleware, service-worker)

1. Identify the single consumer.
2. Copy the relevant logic into the consumer codebase.
3. Update the consumer imports.
4. Verify the tests pass.
5. Delete the package directory.
6. Run the full monorepo build and test.

### For each "remove entirely" package (intl, monorepo-tools, telemetry)

1. Find all imports across the monorepo.
2. Replace the intl usage with project-local constants.
3. Remove monorepo-tools from CI scripts, lint configs, and tooling.
4. Strip the telemetry calls from all code paths.
5. Delete each package directory.
6. Run the full monorepo build and test.

### Cleanup order

1. `telemetry` (no dependencies on other candidates)
2. `intl` (may depend on nothing else being removed)
3. `monorepo-tools` (CI impact — do last among "remove entirely")
4. `hono-middleware` (consumer migration)
5. `service-worker` (consumer migration)

## Verification

- `pnpm -r test` passes.
- `pnpm -r build` passes.
- `pnpm -r lint` passes.
- No imports remain pointing to deleted packages. The command `rg "from ['\"]@ethang/(hono-middleware|intl|monorepo-tools|service-worker|telemetry)"` returns empty.

## Risks

- `monorepo-tools` removal may break CI. Audit all CI configs first.
- `telemetry` may be deeply embedded. Search the code exhaustively.
- The order matters. Remove the packages in the listed sequence. The sequence avoids cascade failures.
