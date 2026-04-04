# Questioner Session — Design-Pipeline Questioner Stage Rewrite

**Date:** 2026-04-04
**Status:** COMPLETE
**Dispatched to:** design-pipeline (Stage 2 via claude skill handoff)

---

## Purpose
Rewrite the design-pipeline's questioner stage (Stage 1) as a standalone multi-turn CLI session using the Anthropic SDK directly, replacing the old ClaudeAdapter-based single-shot approach. This enables a true conversational interview loop where the agent asks questions one at a time, the user responds, and the session continues until natural sign-off — all within a single persistent conversation context managed by the TypeScript CLI.

## Artifact / Output Type
Modified TypeScript modules in `packages/design-pipeline/`:
- New `runQuestionerSession()` function replacing old `executeQuestioner()` + `executeStreaming()`
- Enriched system prompt built from the questioner skill's behavioral rules
- Structured JSON output protocol between LLM and CLI
- Lint-fixer module with retry loop and recipes-based institutional memory
- Feature flag gating stages 2-7 behind legacy path

## Trigger
`runPipeline()` in the CLI entry point, which starts the orchestrator. The orchestrator fires `runQuestionerSession()` and awaits completion via `store.waitFor()`.

## Inputs
- User seed (the design topic to explore)
- Codebase context (explored by the questioner prompt)
- `@ethang/store` PipelineStore instance
- Anthropic SDK client

## Outputs
- Briefing file saved to `docs/questioner-sessions/YYYY-MM-DD_<slug>.md`
- Store `artifacts.Questioner` populated with typed sub-object: `{ questions: QA[], summary: string | null, signedOff: boolean }`
- Store stage status set to `completed` (or `failed` with error kind)
- ESLint-clean briefing markdown (post-processed by lint-fixer if needed)

## Ecosystem Placement
Stage 1 of the design pipeline. After completion, hands off to claude CLI subprocess for stages 2-7 (or runs legacy orchestrator loop when feature flag is enabled for tests).

## Handoff
- **To stages 2-7:** Briefing file path passed to `claude` CLI subprocess as context
- **Feature flag off (production):** Shell out to claude skill for stages 2-7
- **Feature flag on (tests):** Run existing orchestrator loop for stages 2-7

## Error States
- **Malformed JSON from LLM:** Inline retry up to 3 times with "respond in valid JSON" nudge. If exhausted, abort session, save partial briefing marked [INCOMPLETE].
- **Rate limit / network error:** Exponential backoff (1s, 2s, 4s) up to 3 retries per turn. Same abort-to-incomplete if exhausted.
- **User abandonment (Ctrl+C):** SIGINT handler writes partial Q&A transcript to store, saves partial briefing file, store transitions to `failed` with error `user_abandon`.
- **ESLint failures after save:** Lint-fixer module retry loop with double-pass (two consecutive clean runs required). Escalates to user when stuck on rule conflicts or unreachable paths.

## Name
Questioner Stage Rewrite (event-driven @ethang/store architecture)

## Scope
**In scope:**
- New `runQuestionerSession()` multi-turn SDK loop
- Rich system prompt from questioner skill behavioral rules
- Structured JSON output protocol: `{ type: "question" | "summary" | "signoff", content: string }`
- CLI-intercepted summary (non-terminal checkpoint)
- Store integration: `artifacts.Questioner` typed sub-object, `waitFor()` completion gate
- Lint-fixer TypeScript module with recipes file and user escalation
- Feature flag for stages 2-7 (legacy path for tests)
- Delete old questioner code (`executeQuestioner`, `executeStreaming`, `buildQuestionerPrompt`)
- Post-save ESLint autofix on briefing markdown

**Out of scope:**
- Stages 2-7 refactoring (deferred, behind feature flag)
- Background question planning / speculative prefetch
- Programmatic turn cap (liveness from LLM behavior)
- Changes to shared infra (base-coordinator, compensation, retry)
- ClaudeAdapter modifications

## Edge Cases
- User never requests summary — LLM naturally moves toward sign-off when branches exhausted (per prompt behavioral rules)
- Agent produces signoff without user requesting summary first — CLI accepts it (the LLM's completeness check in the prompt covers this)
- User says "keep going" after summary — session continues normally, summary was just a non-terminal checkpoint
- Lint-fixer encounters genuine rule conflict — escalates to user, prints code + description, asks for advice, feeds response into recipes file
- Multiple consecutive lint-fixer failures — continues retrying (high max attempts), escalates to user on stuck issues

## Debate Requested
Yes

---

## Design Decisions Log

### Q1 — Conversation Model
ClaudeAdapter bypassed. Questioner runs as multi-turn conversation loop in CLI process using Anthropic SDK directly. Store tracks session state via events.

### Q2 — Store State Shape
Use existing `artifacts` record with typed questioner sub-object. `onPropertyChange` + `subscribe` + `waitFor` work against artifacts naturally.

### Q3 — Session-to-Store Communication
The "session" is an in-process conversation array (`messages: MessageParam[]`) managed by the CLI loop. Store is in the same Node process — direct synchronous updates after each turn. No cross-process communication needed.

### Q4 — Prompt Construction Split
Behavioral rules (questioning philosophy, one Q per turn, recommendations, freeform discovery, completeness check, JSON format) in system prompt. Mechanical enforcement (Zod validation, sign-off flow, briefing save, handoff, store updates) in CLI code.

### Q5 — Mid-Session Summary
CLI intercepts magic phrase (e.g., "/summary"), injects instruction to agent. Non-terminal — agent gives summary, asks if user wants to continue or sign off.

### Q6 — Background Planning
Dropped. Sequential SDK loop is fast enough. Agent plans implicitly within its context window.

### Q7 — Orchestrator Completion Signal
Orchestrator uses `store.waitFor(s => s.stages.Questioner.status === "completed" || s.stages.Questioner.status === "failed")`. Fire and wait pattern — questioner session owns all internal transitions.

### Q8 — Stages 2-7 Handoff
CLI shells out to `claude` CLI subprocess with briefing path. Existing stage 2-7 code kept behind feature flag for tests. Feature flag only for stages 2-7 — questioner always uses new path.

### Q9 — Error Handling
Simple inline retry (3x) with exponential backoff per turn. SIGINT handler for clean abort. Store only notified of final outcome.

### Q10 — Sign-off Flow, User I/O, Shared Infra, Feature Flag
Sign-off: write briefing, store completed, return path. User I/O: Node readline, formatted output. Shared infra: untouched. Feature flag: existing `sdkEnabled` system, branching `if` in orchestrator.

### Q11 — Turn Cap
No programmatic turn cap. Liveness from LLM behavioral instructions in prompt.

### Q12 — Summary-to-Signoff Handshake
Option B: CLI sends user's "yes" to LLM, LLM responds with `{ type: "signoff" }` containing final briefing. LLM is single source of truth for session content.

### Q13 — Lint-Fixer Form
TypeScript module in `packages/design-pipeline/src/` using Anthropic SDK. Not a .claude skill/agent — lives inside the TS CLI package.

### Q14 — Lint-Fixer Mechanical Flow
Retry loop with double-pass (two consecutive clean ESLint runs required). Escalates to user when stuck. User interactions feed into colocated recipes file. Max attempts set high; scale deferred.

### Pipeline Convention (Documentation)
All pipeline writers must complete test→fix→lint→fix→tsc→fix loop TWICE (double-pass). Avoids cascading breakage.
