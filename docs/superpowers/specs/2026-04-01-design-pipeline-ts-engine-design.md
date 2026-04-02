# Design Pipeline TypeScript Engine

**Date:** 2026-04-01
**Status:** Draft
**Scope:** Rename `agent-contracts` to `design-pipeline`, add missing agent contracts, build Bun-powered pipeline orchestration engine

## Problem

The design pipeline is currently orchestrated by a ~500-line SKILL.md that Claude interprets. This has no mechanical enforcement of phase sequencing, retry budgets, expert consistency, or contract validation. State tracking is informal and error-prone.

## Solution

TypeScript becomes the hidden engine behind `/design-pipeline`. Claude still handles the UX (dispatching agents, talking to the user), but TS owns state, validation, routing, and enforcement. The engine is a Bun CLI that Claude calls via `bun run` at each phase boundary.

## Package Structure

Rename `packages/agent-contracts` to `packages/design-pipeline`. Package name becomes `@ethang/design-pipeline`.

```
packages/design-pipeline/
├── src/
│   ├── contracts/
│   │   ├── shared/
│   │   │   ├── frontmatter.ts
│   │   │   ├── section.ts
│   │   │   └── handoff-contract.ts
│   │   ├── questioner.ts
│   │   ├── debate-moderator.ts
│   │   ├── tla-writer.ts
│   │   ├── implementation-writer.ts
│   │   ├── trainer-input.ts
│   │   ├── trainer-output.ts
│   │   ├── typescript-writer.ts
│   │   ├── hono-writer.ts
│   │   ├── ui-writer.ts
│   │   ├── vitest-writer.ts
│   │   └── playwright-writer.ts
│   ├── state-machine/
│   │   ├── step-lifecycle.ts
│   │   └── pipeline-lifecycle.ts
│   ├── engine/
│   │   ├── pipeline-engine.ts
│   │   ├── pipeline-runner.ts
│   │   ├── state-store.ts
│   │   └── validator.ts
│   └── index.ts
├── package.json
├── vitest.config.ts
└── tsconfig.json
```

All existing tests move with their source files into the new directory structure.

## Pipeline State Machine

### Phases

```
IDLE -> PHASE_1_QUESTIONER -> PHASE_2_DESIGN_DEBATE -> PHASE_3_TLA_WRITER
-> PHASE_4_TLA_REVIEW -> PHASE_5_IMPLEMENTATION -> PHASE_6_PAIR_PROGRAMMING
-> COMPLETE | HALTED
```

### Persisted State Object

The `accumulatedContext` uses a discriminated union keyed by phase. Each phase's context type includes all prior phases' fields as required (non-null), making it impossible to represent invalid combinations like `tlaSpecPath` being set without `briefingPath`. The Zod schema enforces this at the type level.

```ts
// Phase-specific context types (each includes all prior fields as required)
type Phase1Context = { briefingPath: string; experts: string[] }
type Phase2Context = Phase1Context & { designConsensusPath: string }
type Phase3Context = Phase2Context & { tlaSpecPath: string; tlcResult: "PASS" | "FAIL" | "UNVERIFIED" }
type Phase4Context = Phase3Context & { tlaReviewPath: string }
type Phase5Context = Phase4Context & { implementationPlanPath: string }

// The state object
{
  phase: PipelinePhase,
  slug: string,
  startedAt: string,
  retries: Record<PipelinePhase, number>,
  accumulatedContext: Phase1Context | Phase2Context | Phase3Context | Phase4Context | Phase5Context | {},
  haltReason: string | null,
}
```

The `experts` field lives inside `Phase1Context` (set during questioner phase) rather than at the top level, since it is part of the accumulated context that grows with each phase.

### Transition Guards

**Forward transitions:**
- `IDLE -> PHASE_1`: unconditional (always valid)
- `PHASE_1 -> PHASE_2`: requires `briefingPath` non-null and `experts` non-empty
- `PHASE_2 -> PHASE_3`: requires `designConsensusPath` non-null
- `PHASE_3 -> PHASE_4`: requires `tlaSpecPath` non-null
- `PHASE_4 -> PHASE_5`: requires `tlaReviewPath` non-null
- `PHASE_5 -> PHASE_6`: requires `implementationPlanPath` non-null
- `PHASE_6 -> COMPLETE`: unconditional

**Backward transitions (exhaustive list):**
- `PHASE_3 -> PHASE_1`: restart from questioner (clears all accumulated context)
- `PHASE_4 -> PHASE_3`: TLA+ review rejects spec, back to tla-writer (clears `tlaSpecPath`, `tlcResult`, `tlaReviewPath`)
- `PHASE_4 -> PHASE_1`: restart from questioner (clears all accumulated context)

No other backward transitions are valid. PHASE_2 cannot go backward (debate either produces consensus or halts). PHASE_5 and PHASE_6 cannot go backward (implementation and execution are forward-only or halt).

All backward transitions increment `retries[targetPhase]`. A `maxPipelineRetries` constant (default: 3) is enforced. When `retries[targetPhase] >= maxPipelineRetries`, the backward transition is blocked and the only option is `-> HALTED`.

**Halt transition:**
- `-> HALTED` is valid from any non-terminal state, unconditionally

**Safety invariant — monotonic accumulated context:** Once a context path is set non-null, it remains non-null unless a backward transition explicitly clears it. The fields that a backward transition clears are defined above. The state store enforces this: `saveSession` rejects any state where a field that should be non-null (based on the current phase) has been set back to null without a corresponding backward transition.

## State Store

File-based persistence using Bun APIs (`Bun.file()`, `Bun.write()`).

**Location:** `packages/design-pipeline/state.json`

**The state file is ephemeral.** It lives alongside the TypeScript source, not in `docs/`, because it is a runtime artifact -- not documentation. It is replaced on every fresh `/design-pipeline` run and only holds current working state. The durable record is the session index markdown file. The state file should be gitignored.

**Operations:**
- `createSession(slug)` -- writes initial IDLE state
- `loadSession(slug)` -- reads + Zod-validates from disk
- `saveSession(state)` -- validates against `PipelineStateSchema` before writing

**Atomic writes:** All writes use a write-to-temp-then-rename pattern. `saveSession` writes to `state.tmp.json`, validates the written file, then renames it over `state.json`. If the process crashes mid-write, the temp file is corrupt but `state.json` remains intact from the last successful save. On load, if `state.json` is missing but `state.tmp.json` exists, the temp file is deleted (it represents a failed write).

**Single-instance guard:** On `createSession` and `loadSession`, the engine writes a `state.lock` file containing the process PID. If `state.lock` exists and the PID is still running, the engine returns an error: `{ "error": "PIPELINE_LOCKED", "pid": <N> }`. The lock file is deleted on COMPLETE, HALTED, or process exit.

Every read and write validates against the schema. Invalid state is never persisted or loaded.

## Agent Contracts

### Existing Contracts (move to new paths)

- **questioner** -- `dispatchTargetListSchema`, `decisionGuideRowSchema`
- **implementation-writer** -- `CodeWriterEntrySchema`, `CodeWriterListSchema`
- **trainer input** -- `TrainerInputSchema` (step assignment with TLA+ coverage, renamed to `CodeWriterInputSchema` in shared/)
- **trainer output** -- `TrainerOutputSchema` (artifact with frontmatter, sections, manifest, handoff)
- **shared** -- `FrontmatterSchema`, `SectionSchema`, `HandoffContractSchema`
- **step-lifecycle** -- TDD step state machine with transition guards

### New Contracts

**debate-moderator:**
- Input: `topic` (string), `experts` (string array), `context` (string)
- Output: `synthesis` (string), `rounds` (number, min 1), `consensusReached` (boolean), `unresolvedDissents` (string array), `participatingExperts` (string array)
- Heuristic: every expert from input `experts` must appear in output `participatingExperts`

**tla-writer:**
- Input: `briefingPath` (string), `designConsensus` (string)
- Output: `specPath` (string), `cfgPath` (string), `tlcResult` ("PASS" | "FAIL"), `tlcOutput` (string), `specContent` (string)
- Heuristic: `specContent` must match one of two keyword sets:
  - **TLA+ style:** contains `VARIABLES`, `Init`, `Next`, and at least one safety property (`INVARIANT` keyword or `[]` temporal operator)
  - **PlusCal style:** contains `variables`, `begin`, `process` or `algorithm`, and the auto-generated translation markers (`\* BEGIN TRANSLATION`)
  - Either set satisfying is sufficient. This prevents false-rejection of PlusCal specs that compile to TLA+ with different surface syntax.

**Shared code writer input:** The existing `TrainerInputSchema` (step number, files, description, dependencies, TLA+ coverage) is renamed to `CodeWriterInputSchema` in `contracts/shared/`. All code writers -- typescript-writer, hono-writer, ui-writer, and trainer -- use this same input schema. The trainer-specific `trainer-input.ts` becomes a re-export of `CodeWriterInputSchema` with a `@deprecated` JSDoc tag and a removal target of the next major version. This prevents indefinite dual-path maintenance.

**Shared code writer output:** A `CodeWriterOutputSchema` in `contracts/shared/` defines the common output shape: `filesWritten` (string array, min 1), `testsPass` (boolean), `tddCycles` (number, min 1). Each writer applies its own file extension heuristic.

**typescript-writer:**
- Input: `CodeWriterInputSchema`
- Output: `CodeWriterOutputSchema`
- Heuristic: all paths in `filesWritten` end with `.ts`

**hono-writer:**
- Input: `CodeWriterInputSchema`
- Output: `CodeWriterOutputSchema`
- Heuristic: all paths in `filesWritten` end with `.ts`

**ui-writer:**
- Input: `CodeWriterInputSchema`
- Output: `CodeWriterOutputSchema`
- Heuristic: all paths in `filesWritten` end with `.tsx`

**vitest-writer:**
- Input: task assignment (step number, files, description, dependencies, TLA+ coverage) + `codeWriter` (string, the partner code writer identity)
- Output: `testFilesWritten` (string array, min 1), `testCount` (number, min 1), `allPass` (boolean)
- Heuristic: all paths in `testFilesWritten` end with `.test.ts`

**playwright-writer:**
- Input: same shape as vitest-writer input
- Output: same shape as vitest-writer output
- Heuristic: all paths in `testFilesWritten` end with `.spec.ts`

## Validator

Two-pass validation that returns linter-style structured errors.

### Return Shape

The validator return shape is itself a Zod schema (`ValidationResultSchema`) with its own test suite, since it is a contract consumed by Claude's parsing logic. If this shape drifts, Claude will misinterpret validation failures.

```ts
{
  valid: boolean,
  errors: Array<{
    path: string,
    code: string,        // prefixed: "STRUCTURAL_*" for Zod failures, "HEURISTIC_*" for domain checks
    expected: string,
    received: string,
    hint: string,
  }>
}
```

Error codes use a namespace prefix to distinguish structural from heuristic errors:
- `STRUCTURAL_MISSING_FIELD`, `STRUCTURAL_INVALID_TYPE`, etc. — from Zod schema failures
- `HEURISTIC_MISSING_EXPERT`, `HEURISTIC_WRONG_EXTENSION`, `HEURISTIC_TLA_INCOMPLETE`, etc. — from domain checks

This allows Claude (and tests) to distinguish the two validation passes by error code prefix.

### Validation Passes

1. **Structural pass** -- run the Zod schema. On failure, map Zod issues to the error shape. Short-circuit before heuristics.
2. **Heuristic pass** -- run domain-specific checks against the parsed output and the current pipeline state. Examples:
   - Expert participation: every selected expert must appear in debate synthesis
   - TLA+ completeness: spec must contain required keywords
   - File extension matching: writer output files must match expected extensions

### Per-Phase Functions

```ts
validateQuestionerOutput(output: unknown, state: PipelineState): ValidationResult
validateDebateOutput(output: unknown, state: PipelineState): ValidationResult
validateTlaWriterOutput(output: unknown, state: PipelineState): ValidationResult
validateImplementationOutput(output: unknown, state: PipelineState): ValidationResult
validateCodeWriterOutput(output: unknown, state: PipelineState, writerType: string): ValidationResult
validateTestWriterOutput(output: unknown, state: PipelineState, writerType: string): ValidationResult
```

## CLI Entrypoint

The engine is split into two layers:

1. **Importable functions** (`engine/pipeline-engine.ts`) — all logic as pure functions that tests call directly:
   - `startPipeline(slug: string): PipelineResponse`
   - `advancePipeline(slug: string, outputPath: string): PipelineResponse`
   - `getPipelineStatus(slug: string): PipelineState`

2. **CLI entrypoint** (`engine/pipeline-runner.ts`) — thin wrapper that parses `process.argv`, calls the engine functions, and writes JSON to stdout. Only a single integration test covers this layer.

The CLI exposes three commands. All output is JSON to stdout.

```bash
bun run packages/design-pipeline/src/engine/pipeline-runner.ts start <slug>
bun run packages/design-pipeline/src/engine/pipeline-runner.ts advance <slug> <output-json-path>
bun run packages/design-pipeline/src/engine/pipeline-runner.ts status <slug>
```

**`start <slug>`** -- creates a fresh state file at IDLE, returns initial phase context:
```json
{ "phase": "PHASE_1_QUESTIONER", "context": { "seed": "..." } }
```

**`advance <slug> <output-json-path>`** -- reads agent output from a JSON file, validates against current phase contract:
- Valid: updates state, advances to next phase, returns next phase context
- Invalid: returns structured errors, does not advance state
- Missing/unreadable/invalid JSON file: returns `{ "valid": false, "errors": [{ "code": "STRUCTURAL_INVALID_INPUT", "hint": "..." }] }`

```json
// success
{ "phase": "PHASE_2_DESIGN_DEBATE", "context": { "briefingPath": "...", "experts": [...] } }

// failure
{ "valid": false, "errors": [{ "path": "participatingExperts", "code": "HEURISTIC_MISSING_EXPERT", ... }] }
```

**`status <slug>`** -- returns current state for Claude to resume after interruption.

## SKILL.md Changes

The existing `design-pipeline/SKILL.md` becomes a thin wrapper:

**Keeps:** user-facing description, trigger, how to dispatch agents, how to present user choices
**Delegates to TS:** phase sequencing, validation, retry tracking, state persistence, expert enforcement

The SKILL.md instructs Claude to call the CLI at each boundary and follow the JSON response. The engine is authoritative -- if SKILL.md and engine disagree, the engine wins.

## Testing Strategy

All TDD with Vitest, 100% coverage thresholds.

**Contract tests** (one `.test.ts` per contract):
- Valid fixtures parse successfully
- Invalid fixtures produce expected Zod errors
- Heuristic refinements catch domain violations

**State machine tests** (`pipeline-lifecycle.test.ts`):
- Every valid forward transition allowed with correct guards
- Every valid backward transition allowed and increments retry count
- Backward transition blocked when `retries[targetPhase] >= maxPipelineRetries`
- Every invalid transition rejected exhaustively
- Terminal states (COMPLETE, HALTED) have no outgoing transitions
- Guards enforce accumulated context requirements (discriminated union types)
- IDLE -> PHASE_1 is unconditional

**Validator tests** (`validator.test.ts`):
- Structural pass catches Zod failures, maps to error shape with `STRUCTURAL_*` codes
- Heuristic pass catches domain violations with `HEURISTIC_*` codes
- Two-pass ordering: structural errors short-circuit before heuristics
- `ValidationResultSchema` itself is tested for shape stability
- TLA+ heuristic accepts both TLA+ style and PlusCal style keyword sets
- Expert participation heuristic uses set comparison with clear missing-expert errors

**State store tests** (`state-store.test.ts`):
- Create/load/save round-trip with real temp files
- Load rejects corrupted JSON via schema validation
- Atomic write: temp file is written first, then renamed over state.json
- Recovery: if state.json missing but state.tmp.json exists, temp is deleted
- Lock file prevents concurrent access; returns PIPELINE_LOCKED error
- Lock file cleaned up on COMPLETE/HALTED

**Engine tests** (`pipeline-engine.test.ts`):
- `startPipeline` creates valid initial state
- `advancePipeline` with valid output transitions phase
- `advancePipeline` with invalid output returns errors, does not transition
- `advancePipeline` with missing/invalid JSON file returns STRUCTURAL_INVALID_INPUT
- `getPipelineStatus` returns current state
- Tests call importable functions directly (no subprocess spawning)

**CLI integration test** (`pipeline-runner.test.ts`):
- Single thin test that spawns the CLI and verifies JSON stdout for each command

No mocks for file system -- use real temp directories for Bun file API integration tests.
