# Elicitor Session — vibe-cli Cleanup Improvements

**Date:** 2026-04-11
**Status:** COMPLETE
**Feature:** cleanup-improvements

---

## Purpose
Address 7 known issues and improvements tracked in cleanup.md that span worktree isolation, pipeline resumability, test coverage architecture, and bug fixes. These changes harden the pipeline's reliability, enforce agent sandboxing, and establish a comprehensive 300% test coverage model.

## Artifact / Output Type
Multiple changes across the vibe-cli pipeline:
- PowerShell script modifications (worktree, warden, resume, parallel bug fix)
- New PowerShell parsers (Gherkin parser, TLC output parser)
- Fixture file generation integrated into pipeline stages
- Playwright test generation for UI projects
- vibe-cli's own test suite upgraded to 300% coverage

## Trigger
These are internal improvements to the vibe-cli pipeline. They affect every pipeline run.

## Inputs
- Existing pipeline stages and utilities
- BDD `.feature` files (full Gherkin syntax)
- TLC model checker output (all output types)
- `pipeline.log` (for resume detection)

## Outputs
Seven distinct deliverables:

### 1. Always Use Worktrees
- Remove the single-task skip path in `New-TaskWorkspace()`
- Every task gets its own worktree, even single-task tiers
- Simplifies workspace logic, ensures consistent isolation

### 2. Warden Agent Restriction
- Configure warden to scope each coding agent to its worktree
- **Read-only:** full repo access
- **Write:** restricted to the agent's worktree directory only (`.worktrees/<feature>-<taskId>-<runId>/`)

### 3. Implementation Writer Explicit Paths
- Pass both TLA+ spec path AND BDD feature path explicitly to stage 6 (implementation writer)
- Currently only TLA+ path is passed; BDD path must be added to the stage orchestrator

### 4. Parallel Coding Tasks (Bug Fix)
- Same-tier tasks in stage 8 should fan out in parallel
- Something is serializing dispatch — diagnose and fix
- This is a bug, not a design change

### 5. `--resume` Flag
- Replace `-Stage # -Feature <feature>` with a single `--resume` flag
- Parse `pipeline.log` to auto-detect:
  - The feature name
  - The last completed stage
- Resume from the next stage
- Assumes single concurrent run (pipeline.log is cleared after every run)
- **Fail with clear error** if `pipeline.log` is empty or missing ("No previous run found")

### 6. 300% Test Coverage Model
Three independent 100% coverage targets, each with a specific methodology:

#### Unit — Property-Based Testing (PBT)
- **Source:** TLC verification output (all output, not just invariants)
- **Parser:** PowerShell script that mechanically parses TLC output
- **Fixture path:** `tests/fixtures/tla/`
- **Timing:** Fixtures generated after stage 5 (TLA+ debate consensus), before stage 6

#### Integration — Contract Testing
- **Source:** BDD `.feature` files (full Gherkin spec — Scenario Outlines, data tables, Examples, tags, Backgrounds, doc strings, rule groups)
- **Parser:** PowerShell script that mechanically parses Gherkin syntax
- **Fixture path:** `tests/fixtures/bdd/`
- **Timing:** Fixtures generated after stage 3 (BDD debate consensus), before stage 4

#### E2E — Trace-Based Testing
- **Source:** TLC output — all trace types, error traces, counterexamples, state graphs, etc.
- **Fixture path:** `tests/fixtures/tla/` (shared with PBT fixtures)
- **For UI projects:** Playwright tests that read trace fixtures directly, map state transitions to browser actions/HTML assertions via LLM interpretation. Coverage enforcement ensures correctness despite LLM mapping.
- **For non-UI projects:** Trace replay against deployed system

#### Enforcement
- 300% coverage is a hard gate in the stage 8 TDD cycle
- All three categories must independently reach 100%
- **vibe-cli itself** meets this same 300% coverage standard (dogfooding)

#### Parser Completeness
- Parsers must be comprehensive — capture all useful output, not limited to specific examples
- BDD parser: full Gherkin spec
- TLC parser: all structured output sections (invariants, traces, deadlocks, liveness, temporal properties, coverage, counterexamples, state graphs)

#### Parser Failure
- If a parser fails to parse BDD or TLC output, the pipeline **halts and fails**
- User can fix the issue and `--resume`

### 7. TLA+ Traces to Fixtures
- Subsumed into item 6
- All TLA+ output (not just error traces) goes to `tests/fixtures/tla/` after stage 5 debate consensus

## Ecosystem Placement
Internal improvements to vibe-cli. These changes affect the pipeline itself and all projects built through it.

## Trigger
Improvements are applied to the vibe-cli codebase directly. The 300% coverage model becomes enforced on every pipeline run for generated projects.

## Handoff
- Fixture parsers produce files consumed by test writers in stage 8
- Warden config is consumed by the coding stage when dispatching agents
- `--resume` is consumed by the pipeline entry point (`vibe.ps1`)

## Error States
- **Parser failure:** Pipeline halts with error. User fixes and resumes via `--resume`.
- **Empty `pipeline.log` on `--resume`:** Fail with message "No previous run found — start a new run with `./vibe.ps1 'prompt'`"
- **Warden blocks a legitimate write:** Agent fails; user must update warden allow rules via `/warden allow`
- **Parallel dispatch failure:** Individual task failure should not block other parallel tasks in the same tier (existing behavior)

## Name
`cleanup-improvements`

## Scope
### In scope
- All 7 items from cleanup.md
- vibe-cli's own test suite upgraded to 300% model
- Playwright integration for UI project E2E tests

### Out of scope
- Changes to stages 1-7 agent prompts (beyond adding fixture generation hooks)
- New expert agents or reviewer changes
- CI/CD integration of the 300% gate (local enforcement only for now)
- Gherkin parser supporting non-English keywords

## Edge Cases
- **TLC produces no error traces:** Parser still generates fixtures from other output types (invariants, state space, etc.). PBT and contract tests still enforce coverage independently.
- **BDD file has no Scenario Outlines or data tables:** Parser handles minimal Gherkin (just Scenario + steps). Fixtures are still generated.
- **Single-task tier with worktree:** Now always creates a worktree. If worktree creation fails, task fails (existing rollback behavior in `New-TaskWorkspace()`).
- **`--resume` after stage 8 partial completion:** Must detect which tasks/tiers completed from `pipeline.log` and resume remaining work.
- **Playwright not available in target project:** E2E trace tests fall back to non-UI trace replay.

---

## Open Questions
None — all branches resolved.
