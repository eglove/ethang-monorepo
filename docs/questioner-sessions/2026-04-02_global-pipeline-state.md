# Questioner Session -- Global Pipeline State Design

**Date:** 2026-04-02
**Status:** COMPLETE -- READY FOR DEBATE
**Branches:** 9 of 10 resolved, 1 skipped (Branch 10)

---

## Purpose

Design a global state file that becomes the single source of truth for live pipeline state, replacing the state documentation currently embedded in design-pipeline's SKILL.md. The SKILL.md would then focus purely on behavioral instructions.

---

## Decision Tree

### Branch 1: Purpose and Relationship to accumulated_context

**Question:** The accumulated_context currently serves as the narrative thread passed between stages. Should the global state file replace accumulated_context entirely, or supplement it?

**Answer:** Keep accumulated_context -- the state file supplements it. Design-pipeline SKILL.md sheds its state documentation (changeFlag description, accumulated context table, stage status tracking) because the global state file becomes the single source of truth for live state. SKILL.md focuses purely on behavioral instructions.

**Decision:** State file = live state truth. SKILL.md = behavioral instructions only. accumulated_context = narrative text still passed to agents.

---

### Branch 2: File Format and Location

**Question:** What format and where should the state file live?

**Answer:** Markdown format. Located at `docs/pipeline-state.md`. Singleton file cleared at the start of each run.

**Decision:** `docs/pipeline-state.md`, markdown, cleared per run.

---

### Branch 3: Session Index Relationship

**Question:** The session index at `docs/design-pipeline-sessions/` currently tracks pipeline runs. How does the state file interact with it?

**Answer:** Kill the session index directory. The state file replaces it. Git history serves as the archive for past runs.

**Decision:** Remove `docs/design-pipeline-sessions/`. State file replaces session tracking. Git history = archive.

---

### Branch 4: Error and Retry Strategy

**Question:** When a stage fails, what does the state file enable -- retry, skip, or manual intervention?

**Answer:** Retry in place, then halt. No skipping stages. If a stage fails, retry it. If retry fails, halt the pipeline. The state file records the failure and the pipeline stops.

**Decision:** Retry in place then halt. No stage skipping.

---

### Branch 5: What Gets Stored

**Question:** What data belongs in the state file -- full stage outputs, summaries, or just status flags?

**Answer:** Variables and paths only. No full output capture. The state file is a variable store (current stage, status, timestamps, file paths to artifacts), not a document store. Stage outputs live in their own artifact files.

**Decision:** Variable store only. No document content. Paths point to artifacts.

---

### Branch 6: Write Ownership

**Question:** Who writes to the state file -- a centralized engine/orchestrator, or the agents themselves?

**Answer:** Any agent can write. Distributed ownership with no centralized gatekeeper. The Bun CLI engine no longer exists, so there is no central coordinator to own writes.

**Decision:** Distributed write access. Any agent updates the state file directly.

---

### Branch 7: Conflict Prevention (Multi-Agent Writes)

**Question:** With distributed writes, how do we prevent agents from stomping on each other's state?

**Answer:** Section-scoped ownership. Each agent identifies itself in its own section of the state file. Touching another agent's section is a bug. The file is partitioned by stage/agent, not by data type.

**Decision:** Section-scoped ownership. Agents write only to their own section. Cross-section writes are bugs.

---

### Branch 8: End-of-Run Handling

**Question:** After a pipeline run completes, what happens to the state file -- archive it, clear it, transform it?

**Answer:** Leave as-is after completion. Git history is the archive. No copy/transform step. The next run clears it (per Branch 2).

**Decision:** Leave in place. Next run clears. Git history archives.

---

### Branch 9: Corruption Handling

**Question:** What happens if the state file becomes corrupted or malformed mid-run?

**Answer:** Not applicable. Sequential agent execution and per-run clearing make corruption a non-concern. Only one agent writes at a time, the format is simple markdown, and the file is cleared at the start of each run. There is no realistic corruption vector.

**Decision:** Not applicable -- sequential execution and per-run clearing make corruption a non-concern.

---

### Branch 10: (Skipped)

Skipped at user's request. Proceeding directly to Phase 3 sign-off.

---

## Phase 3: Sign-Off and Expert Council Briefing

### Design Summary

The global pipeline state is a **markdown file at `docs/pipeline-state.md`** that serves as the **single source of truth for live pipeline state**. It replaces the state documentation currently embedded in `design-pipeline/SKILL.md` and eliminates the `docs/design-pipeline-sessions/` directory.

**Core properties:**

| Property | Decision |
|---|---|
| Format | Markdown |
| Location | `docs/pipeline-state.md` |
| Lifecycle | Cleared at start of each run; left in place after completion |
| Content scope | Variables, paths, timestamps, status flags only -- no full outputs |
| Write model | Distributed -- any agent writes to its own section |
| Conflict prevention | Section-scoped ownership; cross-section writes are bugs |
| Error strategy | Retry in place, then halt; no stage skipping |
| Archival | Git history; no copy/transform step |
| Corruption handling | Non-concern (sequential execution, simple format, per-run clearing) |
| Relationship to accumulated_context | Supplements it; does not replace the narrative thread |
| Relationship to SKILL.md | SKILL.md sheds state docs; focuses on behavioral instructions only |

### Downstream Deliverable

A structured briefing for the debate-moderator to evaluate this design with the expert council.

---

## Expert Council Selection

### Roster (from `.claude/skills/orchestrators/debate-moderator/SKILL.md`)

| Expert | Domain | Participate? | Reason |
|---|---|---|---|
| expert-tdd | Test-Driven Development | **YES** | State file needs testable contracts. TDD expert evaluates whether the design supports test-first validation of state transitions. |
| expert-ddd | Domain-Driven Design | **YES** | Core question: is "pipeline state" a well-modeled domain concept? DDD expert evaluates aggregate boundaries, ubiquitous language, and whether the state file is a proper domain artifact or an anemic data dump. |
| expert-tla | TLA+ Formal Specification | **YES** | The state file is fundamentally a state machine (stages, transitions, retry/halt). TLA+ expert can verify whether the design's invariants (section-scoped ownership, no stage skipping, retry-then-halt) are formally sound. |
| expert-edge-cases | Edge Case and Failure Hunting | **YES** | Even though corruption was dismissed, this expert should stress-test that assumption. Also evaluates: what if an agent crashes mid-write? What if git commit fails between runs? What about the clear-on-start race? |
| expert-continuous-delivery | Continuous Delivery and Deployment | **YES** | The state file lives in the repo and gets committed. CD expert evaluates: does this pollute git history? Does clearing per run create noisy diffs? Is there a better lifecycle for CI/CD integration? |
| expert-bdd | Behavior-Driven Development | **SIT OUT** | No user-facing behavior to describe. This is internal infrastructure state, not observable UI or API behavior. BDD scenarios would be forced and unnatural here. |
| expert-atomic-design | Atomic / Component-Driven UI Design | **SIT OUT** | No UI components involved. This is a backend/infrastructure concern with no atoms, molecules, or organisms. |
| expert-performance | Performance Engineering | **SIT OUT** | A single markdown file read/written by one agent at a time has no performance concerns worth debating. |
| expert-lodash | Lodash Utility Library | **SIT OUT** | No data transformation or collection manipulation to evaluate. The state file design is structural, not algorithmic. |

### Selected Experts (5 of 9)

1. **expert-tdd** -- testability of state contracts
2. **expert-ddd** -- domain modeling of pipeline state
3. **expert-tla** -- formal verification of state invariants
4. **expert-edge-cases** -- stress-testing assumptions (especially Branch 9)
5. **expert-continuous-delivery** -- git lifecycle and CI/CD integration

---

## Debate Briefing (for debate-moderator)

**Topic:** Global Pipeline State File Design

**Context:** The design-pipeline skill orchestrates a 6-stage sequential pipeline for feature development. Currently, state is scattered across SKILL.md documentation and a session index directory. This proposal consolidates live state into a single markdown file (`docs/pipeline-state.md`) with distributed agent writes, section-scoped ownership, and a clear-per-run lifecycle. The questioner session above documents all 9 resolved design decisions.

**Key tensions for the council to evaluate:**

1. **Distributed writes with section-scoped ownership** -- Is "touching another section is a bug" enforceable, or does it need a runtime guard?
2. **Git history as archive** -- Is committing a cleared-and-rebuilt state file every run acceptable git hygiene, or does it create noise?
3. **Variables-only content model** -- Is there a risk that agents will need to store richer state than paths and flags, forcing a future redesign?
4. **Corruption dismissed as non-concern** -- Is this justified given sequential execution, or are there edge cases (agent crash, partial write) that deserve a guard?
5. **Session index elimination** -- Does git history truly replace the queryability that a session index provided?

6. **Stale expert-selection references in design-pipeline SKILL.md** -- PR #40 moved expert selection from the questioner to the debate-moderator's autonomous `selectExperts(topic)`. But the design-pipeline SKILL.md still instructs the questioner to include an "Expert Council" section and passes an expert list from Stage 1 to Stages 2 and 4. These stale references must be fixed as part of this pipeline run.

**Experts:** (selected autonomously by debate-moderator)
