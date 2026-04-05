# Questioner Session — Design-Pipeline Event-Driven Refactor

**Date:** 2026-04-04
**Status:** COMPLETE
**Dispatched to:** design-pipeline (debate stage next)

---

## Purpose
Refactor the design-pipeline TypeScript CLI from procedural, parameter-heavy architecture to an event-driven, store-based architecture using `@ethang/store`. Eliminate object mutation, minimize function parameters to near-zero, and adopt functional error handling throughout. Switch LLM provider from Anthropic SDK to OpenRouter for multimodel support.

## Artifact / Output Type
A fully rewritten `packages/design-pipeline` package with store-per-stage architecture, new directory structure, and OpenRouter integration.

## Trigger
User dissatisfaction with current procedural design; desire for event-driven architecture matching `@ethang/store` patterns.

## Inputs
- Current design-pipeline package source code
- `@ethang/store` BaseStore API (subscribe, waitFor, onPropertyChange, update, destroy, reset)
- `@openrouter/sdk` for multimodel LLM access
- `lodash/attempt` and `@ethang/toolbelt attemptAsync` for functional error handling

## Outputs
Scaffolded store-per-stage architecture with class skeletons, state types, method signatures, and test factories. Each phase fine-tuned separately after scaffolding.

## Design Decisions

### 1. Store-Per-Stage Architecture (Q1, Q2, Q3, Q9)
Every stage becomes a `BaseStore` subclass with constructor-injected dependencies. `OrchestratorStore extends BaseStore` owns run-level transitions and destroy() lifecycle. `QuestionerSessionStore` replaces mutable `SessionContext`. `LintFixerStore` replaces mutable `LoopState`. PipelineStore concept absorbed into OrchestratorStore as coordination bus.

### 2. Event-Driven Communication (Q5)
No separate event bus. Direct store-to-store subscriptions via `subscribe`/`waitFor`. Stage stores await upstream results via `waitFor(predicate)`. OrchestratorStore reacts to stage completion events to advance the pipeline.

### 3. Adapters as Store Subclasses (Q6, Q12, Q15, Q16)
Port/Adapter pattern eliminated globally. Classes ARE the contract:
- `OpenRouterStore extends BaseStore` — replaces ClaudeSdkAdapter, sole LLM dependency
- `GitStore extends BaseStore` — replaces ChildProcessGitAdapter
- `FileSystemStore extends BaseStore` — new, for file I/O
Delete `ports/` and `adapters/` directories entirely.

### 4. OpenRouter Multimodel Integration (Q12, Q13)
Drop `@anthropic-ai/sdk` entirely. Use `@openrouter/sdk` as sole LLM dependency. OpenRouterStore owns model resolution via `getModel(stageName)` — stages are model-agnostic. Supports Qwen, Claude, GPT, DeepSeek, Llama, Gemini, etc. State tracks request lifecycle: idle → requesting → streaming → complete/error.

### 5. Functional Error Handling (Q4, Q14)
No try/catch, no throws anywhere. Use `lodash/attempt` (sync) and `@ethang/toolbelt attemptAsync` (async). Every function returns `Error | T` or `Promise<Error | T>`. Result type: `{ok:true, value:T} | {ok:false, error:ErrorKind, message:string}`. Delete `PipelineError` and `createPipelineError`. Keep `ErrorKind` enum.

### 6. Pure Functions Exempted (Q7)
`prompts/` directory (7 pure prompt-building functions) and `schemas/` directory (Zod declarations) stay as-is. No store wrapping for stateless pure functions.

### 7. Entry Points (Q8)
`cli.ts` stays thin — callable by bun, parses argv, loads env. `index.ts` becomes composition root — creates all stores, wires subscriptions, calls `OrchestratorStore.start()`.

### 8. Testing Convention (Q10)
Each store exports companion `createTest<Name>Store()` factory:
- Extends real store class
- Exposes `forceState()` for white-box state setup
- Provides `simulateEvent()` methods for side-effect-free transitions
- Co-located alongside source file
- Tests use `reset()` to reuse instances

### 9. Full Rewrite — Scaffolding First (Q11)
Big bang rewrite. Class-skeleton scaffolding with state types, method signatures (returning notImplemented Result errors), and test factories. User fine-tunes each phase one by one after scaffolding.

### 10. Deletions (Q17, Q19, Q20)
- Compensation engine — eliminated. Each store handles own cleanup via destroy().
- Feature flags — deleted. No legacy path in full rewrite.
- Transitions engine — deleted. OrchestratorStore owns run-level, stage stores own stage-level transitions.

### 11. Shared Utilities (Q18)
Pure `retryWithBackoff(attempt, config)` utility returning `{delayMs, exhausted}`. Each store owns its retry counter and state. Delete `engine/retry.ts` and `base-coordinator.ts`.

### 12. Types and Config (Q21)
- Keep shared enums (`ErrorKind`, `StageState`, `RunState`) in `util/`
- Delete `PipelineError`, `RunRecord`, `StageMap`, `StageRecord`, `createEmptyStageRecord`
- Delete `config/` directory — each store accepts config via constructor params with defaults
- Delete `types/` directory — types colocated in store files

### 13. Naming Conventions (Q21)
- Store classes: `<Name>Store` (OrchestratorStore, QuestionerSessionStore, etc.)
- State types: `<Name>State` (OrchestratorState, QuestionerSessionState, etc.)
- Test factories: `createTest<Name>Store()`

### 14. Store Lifecycle (Q23)
OrchestratorStore calls `destroy()` on all child stores when pipeline completes. Tests use `reset()`. No custom cleanup hooks.

### 15. Directory Structure (Q22)
```
src/
  stores/        — all store subclasses
  prompts/       — pure prompt functions (kept)
  schemas/       — pure Zod schemas (kept)
  util/          — retryWithBackoff, Result type, ErrorKind, shared enums
  skill-tests/   — kept as-is
  cli.ts         — thin bun entry
  index.ts       — composition root
```

Delete: `engine/`, `stages/`, `ports/`, `adapters/`, `types/`, `config/`

### 16. Completeness Audit (Q23)

**DELETE:** adapters/claude-sdk.ts, adapters/git-child-process.ts, adapters/node-file-system.ts, ports/claude-adapter.ts, ports/git-adapter.ts, ports/file-system-adapter.ts, config/feature-flags.ts, config/questioner-config.ts, engine/compensation.ts, engine/transitions.ts, engine/test-store.ts, stages/base-coordinator.ts, types/errors.ts, types/questioner-session.ts, types/run.ts, types/stage.ts

**REWRITE as stores:** orchestrator, questioner-session, debate-moderator, expert-review, fork-join, implementation-planning, pair-programming, lint-fixer, briefing-writer, tla-writer

**KEEP:** prompts/, schemas/, constants.ts, cli.ts, index.ts, skill-tests/

**MOVE:** engine/retry.ts → util/retry.ts

**NEW:** stores/open-router-store.ts, stores/git-store.ts, stores/file-system-store.ts, util/result.ts

## Ecosystem Placement
Standalone CLI package within ethang-monorepo. Uses `@ethang/store` and `@ethang/toolbelt` as internal dependencies.

## Handoff
Briefing goes to design-pipeline debate stage (Stage 2) for expert design debate.

## Error States
- Store initialization failure → OrchestratorStore halts pipeline
- OpenRouter API failure → OpenRouterStore returns Result error, stage store reacts
- File I/O failure → FileSystemStore returns Result error
- Git failure → GitStore returns Result error
- All errors are functional (Result type), never thrown

## Name
design-pipeline (same package, rewritten internals)

## Scope
**In scope:** All src/ files except prompts/, schemas/, skill-tests/. Full architectural rewrite to store-per-stage. OpenRouter integration. Functional error handling.
**Out of scope:** Skill markdown files (.claude/skills/). TLA+ specs. Pipeline state file format. Prompt content. Schema definitions.

## Edge Cases
- Store subscription ordering during composition root setup
- Circular subscription detection (stores subscribing to each other)
- OpenRouter rate limiting across multiple concurrent stage stores
- Store destroy() called during active waitFor() — AbortController handles this
- Model unavailability in OpenRouter — fallback model config in OpenRouterStore

## Hard Requirements
**Double-Pass Verification Loop (MANDATORY):** All writers must follow: test → fix → lint → fix → tsc → fix. Run test, lint, and tsc one at a time. Continue fixing until the loop has completed TWICE (double pass). Task is NOT complete until double pass succeeds. 100% test coverage is REQUIRED.

## Debate Requested
Yes

---

## Open Questions
None — all branches resolved.
