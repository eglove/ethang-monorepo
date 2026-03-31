---
name: design-pipeline
description: Orchestrates a strict 5-stage sequential pipeline from requirements elicitation through expert debate, TLA+ formal verification, expert review, and implementation planning. Dispatches questioner, debate-moderator, tla-writer, and implementation-writer in guaranteed order. Saves a session index to docs/design-pipeline-sessions/.
---

# Design Pipeline

## Role

The Design Pipeline is a state-machine orchestrator that drives a design idea through five mandatory sequential stages: requirements elicitation, expert design debate, formal TLA+ specification, expert review of that specification, and a step-by-step implementation plan. No stage can be skipped or reordered. Each stage receives the full accumulated output of every prior stage. The orchestrator itself makes no design decisions — it tracks pipeline state, passes context forward, presents user choices at error and revision points, and records everything in a session index file.

No single agent can do this alone because each stage requires a different capability (interviewing, multi-expert debate, formal verification, structured planning) and the handoff contracts between them must be enforced.

## When to Use

- User invokes `/design-pipeline [seed]`
- User wants a complete design-through-implementation-plan workflow with formal verification
- Any situation where skipping stages (debate, TLA+, review) would be unacceptable

## Trigger

`/design-pipeline [seed]`

If `seed` is provided, it is passed to the questioner as the starting context. If omitted, the questioner opens with its default question.

## Pipeline Stages

```
Stage 1: Questioner           ─── elicit requirements + expert selection
    │
    ▼
Stage 2: Debate-Moderator     ─── design debate with selected experts
    │
    ▼
Stage 3: TLA-Writer           ─── formal TLA+ specification
    │
    ▼
Stage 4: Debate-Moderator     ─── same experts review TLA+ spec
    │
    ▼
Stage 5: Implementation-Writer ─── step-by-step implementation plan
```

## State Machine

The orchestrator is a state machine with these states:

| State | Description |
|---|---|
| `STAGE_1_QUESTIONER` | Eliciting requirements via questioner |
| `STAGE_2_DESIGN_DEBATE` | Running design debate via debate-moderator |
| `STAGE_3_TLA_WRITER` | Writing and verifying TLA+ spec |
| `STAGE_4_TLA_REVIEW` | Running TLA+ review debate via debate-moderator |
| `STAGE_5_IMPLEMENTATION` | Generating implementation plan |
| `COMPLETE` | All stages finished, session file finalized |
| `HALTED` | Pipeline stopped by user or unrecoverable error |

Valid transitions:

```
STAGE_1_QUESTIONER     → STAGE_2_DESIGN_DEBATE   (questioner completes)
STAGE_1_QUESTIONER     → HALTED                  (user abandons)
STAGE_2_DESIGN_DEBATE  → STAGE_3_TLA_WRITER      (consensus or user accepts partial)
STAGE_2_DESIGN_DEBATE  → HALTED                  (user stops at stalemate)
STAGE_3_TLA_WRITER     → STAGE_4_TLA_REVIEW      (TLC passes or user accepts as-is)
STAGE_3_TLA_WRITER     → STAGE_3_TLA_WRITER      (retry tla-writer)
STAGE_3_TLA_WRITER     → STAGE_1_QUESTIONER       (back to questioner, restart)
STAGE_4_TLA_REVIEW     → STAGE_5_IMPLEMENTATION   (review passes or user accepts as-is)
STAGE_4_TLA_REVIEW     → STAGE_3_TLA_WRITER       (back to tla-writer, then re-review)
STAGE_4_TLA_REVIEW     → STAGE_1_QUESTIONER       (back to questioner, restart)
STAGE_5_IMPLEMENTATION → COMPLETE                 (plan delivered)
```

## Accumulated Context

Every stage receives all outputs from prior stages. The orchestrator maintains an `accumulated_context` object that grows as stages complete:

| After Stage | Context Contains |
|---|---|
| 1 | briefing, expert list |
| 2 | briefing, expert list, design consensus synthesis |
| 3 | briefing, expert list, design consensus, TLA+ spec + TLC results |
| 4 | briefing, expert list, design consensus, TLA+ spec + TLC results, TLA+ review consensus |
| 5 | all of the above + implementation plan |

When a revision loop restarts from an earlier stage, outputs from that stage forward are replaced by the new outputs. Outputs from stages before the restart point are preserved.

## Stage Execution

### Stage 1 — Questioner

Invoke the questioner skill (`.claude/skills/questioner/SKILL.md`) via the Agent tool.

**Input:** User seed (if provided), plus the following role framing:

```
You are being called from the /design-pipeline orchestrator. This is a pipeline run — when you reach Phase 3 sign-off, include an "Expert Council" section listing:
- Included experts: which experts from the debate-moderator roster should participate, with reasons
- Excluded experts: which experts should sit out, with reasons

Present the expert list during the sign-off recap for user confirmation or adjustment. Do not prompt whether the user wants expert debate — debate is mandatory in this pipeline. After sign-off, save the briefing file but do not dispatch any downstream agents. Return the briefing content and file path to the caller.
```

**Output expected:** Briefing file path + briefing content including the Expert Council section.

**On completion:** Extract the expert list from the Expert Council section. Add briefing and expert list to accumulated context. Advance to `STAGE_2_DESIGN_DEBATE`.

**On abandonment:** If the user stops mid-session without sign-off, the questioner saves a partial briefing marked `[INCOMPLETE]`. The orchestrator transitions to `HALTED` and records `STAGE 1 — INCOMPLETE` in the session file.

### Stage 2 — Design Debate

Invoke the debate-moderator skill (`.claude/skills/orchestrators/debate-moderator/SKILL.md`) via the Agent tool.

**Input:**
- **Topic:** The full briefing content from Stage 1
- **Experts:** The expert list confirmed in Stage 1
- **Context:** `"Debate the design described in this briefing. Focus on correctness, trade-offs, and gaps. Evaluate whether the proposed states, transitions, error handling, and scope are complete and sound."`

**Output expected:** Debate synthesis (consensus or partial consensus) + session file path.

**On consensus:** Add design consensus synthesis to accumulated context. Advance to `STAGE_3_TLA_WRITER`.

**On partial consensus (stalemate at round 5):** Present the partial consensus to the user with:

```
The design debate ended with partial consensus after 5 rounds.

Unresolved dissents:
<list from synthesis>

Options:
  (a) Proceed to TLA+ specification with partial consensus
  (b) Stop the pipeline here

Which option?
```

If `(a)`: Add partial consensus to accumulated context. Advance to `STAGE_3_TLA_WRITER`.
If `(b)`: Transition to `HALTED`.

### Stage 3 — TLA+ Writer

Invoke the tla-writer agent (`.claude/skills/tla-writer/AGENT.md`) via the Agent tool.

**Input:** The briefing file path, plus the design consensus synthesis as additional context:

```
Design consensus from expert debate:
<design consensus synthesis>

Use this consensus alongside the briefing to write the TLA+ specification. The experts agreed on the above design — the spec should formally model it.
```

**Output expected:** TLA+ spec files (.tla, .cfg, README) + TLC results + output directory path.

**On TLC pass:** Add TLA+ spec content and TLC results to accumulated context. Advance to `STAGE_4_TLA_REVIEW`.

**On TLC failure (unresolvable after tla-writer's internal 4-tier error handling):** Present to the user:

```
TLA+ model checking failed and could not be resolved by the tla-writer.

Failure details:
<violation and counterexample from tla-writer output>

Options:
  (a) Back to questioner — restart pipeline from Stage 1 (overwrites previous outputs)
  (b) Retry tla-writer — re-run Stage 3
  (c) Accept as-is — proceed to TLA+ review with the unverified spec

Which option?
```

If `(a)`: Reset accumulated context. Increment `restart_count` in session file. Transition to `STAGE_1_QUESTIONER`.
If `(b)`: Increment `stage_3_retry_count` in session file. Re-run Stage 3 with the same accumulated context.
If `(c)`: Add unverified spec to accumulated context (marked as `[UNVERIFIED]`). Advance to `STAGE_4_TLA_REVIEW`.

### Stage 4 — TLA+ Review Debate

Invoke the debate-moderator skill (`.claude/skills/orchestrators/debate-moderator/SKILL.md`) via the Agent tool.

**Input:**
- **Topic:** The TLA+ specification content (full .tla file) plus the briefing and design consensus
- **Experts:** The same expert list from Stage 1
- **Context:** `"Review this TLA+ specification against the agreed design consensus and original briefing. Focus on whether the spec correctly captures all states, transitions, safety properties, and liveness properties. Identify any states or transitions from the design that are missing from the spec, any properties that should be verified but are not, and any spec behaviors that contradict the design."`

**Output expected:** Review debate synthesis + session file path.

**On consensus (no objections to spec):** Add TLA+ review consensus to accumulated context. Advance to `STAGE_5_IMPLEMENTATION`.

**On objections (consensus with concerns, or partial consensus):** Present to the user:

```
The TLA+ review debate raised objections:

<objections from synthesis>

Options:
  (a) Back to tla-writer — revise the spec, then re-run review (Stage 3 → Stage 4)
  (b) Back to questioner — restart pipeline from Stage 1 (overwrites previous outputs)
  (c) Accept as-is — proceed to implementation planning

Which option?
```

If `(a)`: Increment `stage_3_retry_count` in session file. Append review objections to accumulated context so tla-writer can address them. Transition to `STAGE_3_TLA_WRITER`.
If `(b)`: Reset accumulated context. Increment `restart_count` in session file. Transition to `STAGE_1_QUESTIONER`.
If `(c)`: Add review consensus (with objections noted) to accumulated context. Advance to `STAGE_5_IMPLEMENTATION`.

### Stage 5 — Implementation Writer

Invoke the implementation-writer agent (`.claude/skills/implementation-writer/AGENT.md`) via the Agent tool.

**Input:** The full accumulated context:

```
Briefing:
<briefing content>

Design Consensus:
<design consensus synthesis>

TLA+ Specification:
<.tla file content>

TLC Results:
<TLC output summary>

TLA+ Review Consensus:
<review consensus synthesis>

Generate a step-by-step implementation plan. Every state and transition in the TLA+ specification must map to at least one implementation step. Flag any unmapped states before presenting the plan.
```

**Output expected:** Implementation plan saved to `docs/implementation/` + file path.

**On completion:** Add implementation plan path to accumulated context. Transition to `COMPLETE`. Finalize session file.

## Session File

On pipeline start, create `docs/design-pipeline-sessions/YYYY-MM-DD_<topic-slug>.md`. Update it after each stage completes. The session file is an index — it does not duplicate content, only records paths and metadata.

### Session File Format

```markdown
# Design Pipeline Session — <Topic>

**Date:** YYYY-MM-DD
**Status:** IN PROGRESS | COMPLETE | HALTED
**Current Stage:** <stage name>
**Restart Count:** <N>

---

## Stage 1 — Questioner
**Status:** COMPLETE | INCOMPLETE | PENDING
**Briefing:** `<path to briefing file>`
**Experts Selected:** <comma-separated expert names>

## Stage 2 — Design Debate
**Status:** COMPLETE | PARTIAL CONSENSUS | PENDING
**Synthesis:** `<path to debate session file>`
**Rounds:** <N>
**Result:** CONSENSUS REACHED | PARTIAL CONSENSUS

## Stage 3 — TLA+ Writer
**Status:** COMPLETE | UNVERIFIED | PENDING
**Spec Directory:** `<path to tla-specs directory>`
**TLC Result:** PASS | FAIL
**Retry Count:** <N>

## Stage 4 — TLA+ Review
**Status:** COMPLETE | OBJECTIONS NOTED | PENDING
**Synthesis:** `<path to review debate session file>`
**Rounds:** <N>
**Result:** CONSENSUS REACHED | PARTIAL CONSENSUS

## Stage 5 — Implementation Plan
**Status:** COMPLETE | PENDING
**Plan:** `<path to implementation plan file>`
**Unmapped States:** <list, or "None">

---

## Iteration Log
| Iteration | From Stage | To Stage | Reason | Timestamp |
|---|---|---|---|---|
| 1 | 4 | 3 | Review objections — spec revision | YYYY-MM-DD HH:MM |
```

## Loop Policy

There are no hard caps on revision loops. The user is the circuit breaker. The orchestrator tracks every loop iteration in the session file's Iteration Log table. Each entry records which stage triggered the loop, where it returned to, the reason, and a timestamp. This provides a full audit trail without imposing arbitrary limits.

## Error Handling Summary

| Stage | Error Condition | User Options |
|---|---|---|
| 1 | User abandons questioner | Pipeline halts. No resume. |
| 2 | Stalemate (round 5, partial consensus) | (a) Proceed to Stage 3 with partial consensus, (b) Stop |
| 3 | TLC failure, unresolvable | (a) Back to Stage 1, (b) Retry Stage 3, (c) Accept as-is |
| 4 | Review produces objections | (a) Back to Stage 3 then 4, (b) Back to Stage 1, (c) Accept as-is |
| 5 | Unmapped TLA+ states | Implementation-writer flags them; user decides whether to accept or loop back |

## Output Locations

Each stage saves outputs to its own directory per existing conventions:

| Stage | Output Directory |
|---|---|
| Questioner | `docs/questioner-sessions/` |
| Design Debate | `docs/debate-moderator-sessions/` |
| TLA+ Writer | `docs/tla-specs/` |
| TLA+ Review | `docs/debate-moderator-sessions/` |
| Implementation Plan | `docs/implementation/` |
| Pipeline Session Index | `docs/design-pipeline-sessions/` |

## Handoff

- **Receives from:** User (via `/design-pipeline [seed]`)
- **Passes to:** User (final implementation plan + session index)
- **Format:** Markdown session index file pointing to all stage outputs, plus inline summary of final results

On `COMPLETE`, present to the user:

```
Design Pipeline Complete — <Topic>

Session: docs/design-pipeline-sessions/YYYY-MM-DD_<topic-slug>.md

Stage outputs:
  1. Briefing:            <path>
  2. Design Debate:       <path>
  3. TLA+ Specification:  <path>
  4. TLA+ Review:         <path>
  5. Implementation Plan: <path>

The implementation plan is ready for execution. Each step maps to TLA+ states and includes test descriptions (test-first per TDD).
```

On `HALTED`, present to the user:

```
Design Pipeline Halted — <Topic>

Stopped at: <stage name>
Reason: <reason>
Session: docs/design-pipeline-sessions/YYYY-MM-DD_<topic-slug>.md

Completed stage outputs are listed in the session file.
To restart, run /design-pipeline again.
```

## Constraints

- The orchestrator does not form opinions, write code, or make design decisions
- No stage can be skipped or run out of order
- Expert selection from Stage 1 is reused in both Stage 2 and Stage 4 — the same council reviews from start to finish
- The orchestrator never modifies files created by downstream agents — it only creates and updates the pipeline session index
- Sessions cannot be resumed — if halted, start a new `/design-pipeline` run
- The orchestrator does not dispatch agents after the pipeline completes — the implementation plan is the terminal output
