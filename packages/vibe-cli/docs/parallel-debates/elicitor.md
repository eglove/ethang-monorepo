# Elicitor Session — Parallel Debates

**Date:** 2026-04-12
**Status:** COMPLETE
**Feature:** parallel-debates

---

## Purpose
The BDD and TLA+ writing/debating stages are the slowest part of the vibe-cli pipeline (4 sequential stages, up to 20 debate rounds total). Additionally, downstream documents get modified with suggestions but upstream documents do not receive updates, causing consistency drift and requirement conflicts. This feature parallelizes the two writers and unifies the debate loop to solve both problems.

## Artifact / Output Type
Restructured vibe-cli pipeline stages: new PowerShell stage scripts, a parallel execution utility, a unified debate loop function, and a unified debate moderator agent prompt.

## Trigger
The pipeline runs stage 2 (parallel writers) after stage 1 (elicitor) completes and produces a briefing.

## Inputs
- Elicitor briefing (`docs/<feature>/elicitor.md`) — passed to both BDD and TLA+ writers as their sole input. Writers do NOT receive each other's output; they work only from the briefing.

## Outputs
- `bdd.feature` — produced by BDD writer in parallel stage
- `tla/*.tla` — produced by TLA+ writer in parallel stage (includes TLC verification)
- `unified-debate.md` — single session file capturing the full debate history across both documents
- `fixtures/<feature>/bdd/fixture.json` — BDD fixture generated post-debate from final Gherkin
- All artifacts consumed by downstream implementation stages

## Ecosystem Placement
Chained — replaces stages 2-5 of the existing 8-stage pipeline, producing a new 7-stage pipeline.

## Handoff
- Stage 2 (parallel writers) hands both documents to stage 3 (unified debate)
- Stage 3 hands consensus documents to stage 4 (post-debate artifacts)
- Stage 4 hands fixture + final docs to stage 5 (implementation writer), which reads `unified-debate.md` instead of separate `bdd-debate.md` and `tla-debate.md`

## Error States
- **Writer failure during parallel stage:** Wait for the other writer to complete (do not kill it), then fail the stage with an error reporting which writer(s) failed.
- **Revision failure during debate (including TLC check exhaustion):** The debate round fails, the stage logs the error and exits. Successful revisions from the other writer are preserved on disk.
- **Max debate rounds (10) hit:** Log unresolved objections and move on (same as current behavior).

## Name
parallel-debates

## Scope

### In scope
- New stage 2: `2-parallel-writers.ps1` — dispatches BDD and TLA+ writers in parallel via PowerShell jobs
- New stage 3: `3-unified-debate.ps1` — unified debate loop reviewing both documents together
- New stage 4: `4-post-debate.ps1` — BDD fixture generation and any post-debate artifacts
- New utility: `utils/invoke-parallel.ps1` — reusable `Invoke-Parallel` function (used by stage 2 and within debate loop for parallel revisions)
- New debate function: `Invoke-UnifiedDebateLoop` — handles two writers, routes tagged objections, dispatches parallel revisions
- New agent prompt: `agents/unified-debate-moderator.md` — moderator for the unified debate (does NOT evaluate documents directly; orchestrates expert opinions and determines consensus)
- Wire `-Resume` switch into `vibe.ps1` using existing `Resume-Pipeline` utility; remove `-Stage` and `-Feature` parameters
- Update `Resolve-PipelineState` for new 7-stage artifact mapping
- Renumber downstream stages: implementation writer (5), implementation debate (6), coding (7)
- Update implementation writer to read `unified-debate.md` instead of separate debate files

### Out of scope
- Changes to stage 1 (elicitor) — unchanged
- Changes to the implementation debate mechanism — still uses existing `Invoke-DebateLoop`
- Changes to the coding stage — unchanged
- Changes to the expert selection mechanism — unified moderator uses existing experts directory
- Changes to `MaxDebateRounds` — stays at 10

### Deleted files
- `stages/2-bdd-writer.ps1`
- `stages/3-bdd-debate.ps1`
- `stages/4-tla-writer.ps1`
- `stages/5-tla-debate.ps1`

## Edge Cases

### Debate loop mechanics
- **Consensus requires both documents:** The moderator must be satisfied with both BDD and TLA+ simultaneously. No partial graduation — the loop continues until both are approved or max rounds hit.
- **Single-writer objections in a round:** If the moderator only has objections for one writer, only that writer revises — but the pipeline waits for all revisions to complete before the next debate round.
- **Objection routing:** Each objection in the moderator's output is tagged with a `target` field (`"bdd"` or `"tla"`). The pipeline groups by target and routes to the appropriate writer.
- **TLC check bundled with TLA+ writer:** The TLC verification runs as part of the TLA+ writer's revision process, not as a debate loop hook. A TLA+ revision is only "done" when TLC passes.

### Unified moderator schema
```json
{
  "result": "CONSENSUS_REACHED | PARTIAL_CONSENSUS",
  "objections": [
    { "target": "bdd", "objection": "..." },
    { "target": "tla", "objection": "..." }
  ],
  "experts": ["..."],
  "recommendation": {
    "bdd": "...",
    "tla": "..."
  },
  "sessionFile": "unified-debate.md"
}
```
- `recommendation` is split per-writer, used at `CONSENSUS_REACHED` for final revisions
- All participating experts see both documents

### Resume behavior
- `vibe.ps1` entry point changes from `param($Seed, [int]$Stage, [string]$Feature)` to `param($Seed, [switch]$Resume)`
- `-Resume` calls `Resume-Pipeline` which auto-detects feature name and last completed stage from log markers
- Fresh run requires `$Seed`; `-Resume` requires no other arguments
- `Resume-Pipeline` updated to work with 7-stage numbering
- `Resolve-PipelineState` updated:
  - Stage 2+: needs `elicitor.md`
  - Stage 3+: needs `bdd.feature` AND `.tla` file
  - Stage 4+: needs fixture JSON
  - Stage 5+: needs `implementation-plan.md` and `.json`
  - Stage 6+: needs impl debate output
  - Stage 7+: needs logs directory

---

## CRITICAL — End-to-End Wiring

Every component built in this feature MUST be wired together and functional end-to-end. This has been a persistent problem with prior features — utilities are built but never connected (e.g., `Resume-Pipeline` exists but `vibe.ps1` still uses `-Stage`). No utilities left unconnected. No stage scripts that exist but aren't called from `vibe.ps1`. No agent prompts that aren't referenced by the stages that use them. If it's built, it's wired, called, and tested through the full path.

### Required testing layers
1. **Unit tests** — individual functions: `Invoke-Parallel` (both succeed, one fails, both fail, results keyed correctly), objection routing by target, `Resolve-PipelineState` artifact validation per stage, `Resume-Pipeline` stage detection with 7-stage numbering
2. **Integration tests** — stage-level behavior: parallel writers both receive briefing and produce output, unified debate loop routes objections and collects revisions, resume detects correct stage and state
3. **End-to-end tests** — full pipeline flow from elicitor output through parallel writes, unified debate, post-debate artifacts, and into implementation stages. Verify artifacts produced by each stage are correctly consumed by the next. Verify `-Resume` actually resumes at the right point with the right state. Verify `vibe.ps1` entry point works with both fresh runs and `-Resume`.

---

## Open Questions
None — all branches resolved.
