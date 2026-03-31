# Questioner Session — Design Pipeline Orchestrator

**Date:** 2026-03-30
**Status:** COMPLETE
**Dispatched to:** trainer (x2: design-pipeline orchestrator + implementation-writer agent), questioner modification

---

## Purpose
Guaranteed sequential pipeline that takes a design idea from requirements elicitation through expert debate, formal TLA+ verification, expert review of the spec, and finally to a step-by-step implementation plan. No stage can be skipped or run out of order. Solves the problem of ad-hoc, inconsistent design workflows where steps get missed.

## Artifact / Output Type
Two artifacts:
1. **Orchestrator skill** — `/design-pipeline` (SKILL.md) at `.claude/skills/orchestrators/design-pipeline/SKILL.md`
2. **Internal agent** — `implementation-writer` (AGENT.md) at `.claude/skills/implementation-writer/AGENT.md`

Plus a modification to the existing questioner to add expert council selection.

## Trigger
`/design-pipeline [seed]` where seed is optional. If no seed, the questioner phase asks the opening question.

## Inputs
- User seed (optional text) passed to questioner
- Each subsequent stage receives the accumulated outputs of all prior stages

## Outputs

### Pipeline session file
`docs/design-pipeline-sessions/YYYY-MM-DD_<topic-slug>.md` — master index tracking all 5 stages, pointing to individual stage outputs.

### Individual stage outputs (saved to existing locations)
- `docs/questioner-sessions/` — briefing with expert council section
- `docs/debate-moderator-sessions/` — both debate syntheses (design + TLA+ review)
- `docs/tla-specs/` — TLA+ spec (.tla, .cfg, README)
- `docs/implementation/` — step-by-step implementation plan

### Implementation plan format
Ordered steps, each specifying:
- File(s) to create or modify
- What the change does (plain language)
- Which prior step it depends on
- Test description (test to write first, per TDD)
- Explicit mapping to TLA+ states covered by this step

## Ecosystem Placement
Chain — `/design-pipeline` orchestrates the full sequence. All existing skills remain independently callable.

## Handoff

### Complete data flow
```
Stage 1: /questioner
  Input:  user seed
  Output: briefing + expert list (included/excluded with reasons)

Stage 2: /debate-moderator (design debate)
  Input:  briefing + selected experts
  Context: "Debate the design described in this briefing. Focus on correctness, trade-offs, and gaps."
  Output: design consensus synthesis

Stage 3: /tla-writer
  Input:  briefing + design consensus
  Output: .tla spec + .cfg + TLC results + README

Stage 4: /debate-moderator (TLA+ review, SAME experts)
  Input:  briefing + design consensus + TLA+ output
  Context: "Review this TLA+ specification against the agreed design consensus. Focus on whether the spec correctly captures all states, transitions, and safety properties."
  Output: TLA+ review consensus

Stage 5: /implementation-writer
  Input:  briefing + design consensus + TLA+ spec + TLA+ review consensus
  Output: step-by-step implementation plan in docs/implementation/
```

### Questioner modifications
- Add "Expert Council" section to Phase 3 output:
  - Included experts with reasons
  - Excluded experts with reasons
- Add debate prompt: "Would you like this to go through expert debate?"
- When called from /design-pipeline, debate is always yes (skip the prompt)
- When called standalone, debate is optional (user decides)
- Expert list presented during sign-off recap for user confirmation/adjustment

## Error States

### Stage 1 — Questioner abandons
Pipeline halts. Session file saved with `STAGE 1 — INCOMPLETE`. No resume; start fresh.

### Stage 2 — Debate stalemate (round 5, partial consensus)
Pipeline pauses. User decides: proceed to TLA+ with partial consensus, or stop.

### Stage 3 — TLA+ model check failure
TLA-writer's existing 4-tier error handling plays out first. If ultimately unresolvable, user chooses:
- (a) Back to questioner → restart pipeline from Stage 1, overwrite previous docs
- (b) Retry tla-writer → re-run Stage 3
- (c) Accept as-is → proceed to Stage 4

### Stage 4 — TLA+ review produces objections
User chooses:
- (a) Back to tla-writer → re-run Stage 3 then Stage 4
- (b) Back to questioner → restart pipeline from Stage 1, overwrite previous docs
- (c) Accept as-is → proceed to Stage 5

### Loop policy
No hard caps on revision loops. User is the circuit breaker. Orchestrator tracks iteration count in session file.

### Stage 5 — Implementation-writer self-review
Lists every state from the TLA+ spec and maps it to a step. Flags any unmapped state before presenting the plan.

## Name
- Orchestrator: `design-pipeline`
- Implementation agent: `implementation-writer`

## Scope

### In scope
- Orchestrating the 5-stage sequential pipeline
- Passing accumulated context between stages
- Presenting user choices at error/loop points
- Tracking pipeline state in session file

### Out of scope
- Writing code — produces implementation plan only
- Executing the implementation plan
- Modifying existing skills (questioner changes are a separate task)
- Creating new expert agents — works with existing 8 experts
- Monitoring downstream agents after dispatch
- Resuming interrupted sessions — always start fresh
- Hard caps on revision loops

## Edge Cases

### Questioner called standalone vs. from pipeline
- Standalone: expert council section included but debate is optional
- From pipeline: debate is always yes, no prompt needed

### Second debate differentiation
- Orchestrator passes different `--context` role framing for each debate round
- Debate-moderator itself needs no changes — `--context` parameter is sufficient

### Pipeline session as index
- Pipeline session file does not duplicate content — it indexes paths to individual stage outputs
- Each stage still saves to its own directory per existing conventions

---

## Open Questions
None — all branches resolved.
