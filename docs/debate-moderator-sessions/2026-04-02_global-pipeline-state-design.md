# Debate Session -- Global Pipeline State File Design

**Date:** 2026-04-02
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases, expert-continuous-delivery

---

## Round 1

### expert-tdd

Position: The design is sound but needs explicit contracts for what each section of the state file looks like, so agents can be tested for correct writes.

Reasoning: The variables-only content model (paths, timestamps, flags) is the right call -- it keeps the state file thin and testable. But "section-scoped ownership" is only enforceable if there is a typed contract (e.g., a Zod schema or TypeScript interface) that defines what each section contains. Without that, testing whether an agent wrote to the correct section requires parsing raw markdown and hoping the format is stable. A test-first approach demands: (1) define the section schema, (2) write a test that validates an agent's write conforms to its section, (3) implement the write. The current design describes intent ("touching another section is a bug") but provides no mechanism for a test to catch it.

The stale expert-selection references in SKILL.md are a straightforward cleanup -- the questioner's "Expert Council" section and the accumulated_context "expert list" references in Stages 1, 2, and 4 should be removed or reworded to reflect that expert selection is now the debate-moderator's autonomous responsibility.

Objections:
- Section-scoped ownership without a parseable schema is untestable. "Touching another section is a bug" cannot be caught by a test if sections are not machine-identifiable.
- The design does not specify what the state file looks like after clearing. Is it an empty file? A file with section headers but no values? A template? The initial state matters for testing.

Endorsements:
- None (first round)

---

### expert-ddd

Position: The state file is a valid domain artifact, but its identity and lifecycle need sharper domain language.

Reasoning: "Pipeline state" is a domain concept -- it represents the live execution state of a bounded pipeline run. The design correctly separates this from the behavioral instructions (SKILL.md) and the narrative thread (accumulated_context). This is a proper separation of concerns: SKILL.md is the domain's behavioral specification, accumulated_context is the domain's event log, and pipeline-state.md is the domain's current snapshot.

However, the design uses infrastructure language ("file," "section," "cleared") rather than domain language. In DDD terms, the state file is a PipelineRunSnapshot -- a value object that is created fresh for each run, populated as stages complete, and becomes immutable at COMPLETE or HALTED. The "sections" are not generic file sections -- they are stage artifacts (StageResult records). Naming them as such makes the ownership model self-documenting: each stage writes its own StageResult, and writing to another stage's result is a domain invariant violation, not just a convention.

The session index elimination is correct -- the session index was a redundant artifact that duplicated what git history provides. The state file replacing it is a cleaner model.

Stale references: The "Expert Council" section in the questioner's framing (Stage 1) and the "expert list" in accumulated_context should be removed. Expert selection is now a debate-moderator concern, not a questioner concern. The accumulated_context table should drop "expert list" from its Stage 1 row.

Objections:
- The design uses generic names ("section," "state file") instead of domain language. "PipelineRunSnapshot" and "StageResult" would make the model self-documenting and the ownership invariant explicit.

Endorsements:
- None (first round)

---

### expert-tla

Position: The design's state model is sound for the happy path but has an unnamed state between "cleared" and "first stage writes."

Reasoning: The state file has these states:
- ABSENT (before first pipeline run ever)
- CLEARED (start of run, after clearing)
- ACCUMULATING (stages writing their sections)
- COMPLETE_SNAPSHOT (pipeline reached COMPLETE)
- HALTED_SNAPSHOT (pipeline reached HALTED)

Valid transitions:
- ABSENT -> CLEARED [pipeline starts]
- CLEARED -> ACCUMULATING [Stage 1 writes]
- ACCUMULATING -> ACCUMULATING [subsequent stages write]
- ACCUMULATING -> COMPLETE_SNAPSHOT [pipeline completes]
- ACCUMULATING -> HALTED_SNAPSHOT [pipeline halts]
- COMPLETE_SNAPSHOT -> CLEARED [next run starts]
- HALTED_SNAPSHOT -> CLEARED [next run starts]

Safety properties:
- SectionOwnership: For all stages S1 and S2 where S1 != S2, S1 never writes to S2's section.
- NoStageSkip: Stage N's section is written only after Stage N-1's section exists (enforced by sequential execution).
- ClearOnStart: At the start of each run, the file is in CLEARED state (no stale data from prior run).

Liveness properties:
- Progress: If a pipeline run starts (CLEARED), it eventually reaches COMPLETE_SNAPSHOT or HALTED_SNAPSHOT.

The corruption dismissal is justified by sequential execution -- only one agent writes at a time, so there are no concurrent writes. However, there is an implicit state I want to name: CLEARING. Between "the orchestrator decides to clear" and "the file is actually cleared," there is a write operation. If that write fails (disk full, permission error), the file is in a corrupted prior-run state. This is an edge case, not a concurrency problem.

The "retry in place, then halt" error strategy is sound -- it prevents the state machine from entering a SKIPPED state, which would violate NoStageSkip.

Objections:
- The CLEARING state (the act of clearing the file at run start) is not modeled. If the clear operation itself fails, what state is the file in? This should be specified: if clear fails, the pipeline does not start (fail-fast).

Endorsements:
- None (first round)

---

### expert-edge-cases

Position: The design is pragmatic but dismisses corruption too quickly. Three specific edge cases deserve guards.

Reasoning: The sequential execution argument is valid for ruling out concurrent-write corruption. But corruption is not only a concurrency problem.

Edge Cases Found:
- [Partial write] Agent crashes mid-write to its section -- the file is left with a truncated section. Next stage reads the file and finds malformed markdown. Consequence: downstream agent may misparse state or fail with an unhelpful error. Mitigation: each stage should validate the state file is well-formed before writing. This is cheap (parse markdown sections, check expected headers exist) and catches partial writes from prior stages.
- [Clear failure] The "clear at start of each run" operation fails (disk full, file locked by another process on Windows, permission error). The pipeline proceeds with stale state from a prior run. Consequence: agents read stale paths, timestamps, and flags -- silent corruption of the current run. Mitigation: fail-fast if clear fails. Do not start the pipeline.
- [Git commit failure between runs] The design says "git history is the archive." If a user forgets to commit (or the commit fails) between runs, the next run clears the file and the prior run's state is lost with no archive. Consequence: loss of archival data. Mitigation: before clearing, check if the current state file has uncommitted changes. If so, warn or auto-commit.

The session index elimination is acceptable IF the git history archive is reliable. The third edge case above shows it may not be.

Stale references: agree they should be cleaned up. No edge cases in that cleanup.

Objections:
- Partial write (agent crash mid-write) is unhandled. A validation step before each write would catch this cheaply.
- Clear failure is unhandled. Fail-fast on clear failure is essential.
- Uncommitted state file before clearing is an archival gap. The "git history as archive" assumption requires the file to actually be committed.

Endorsements:
- None (first round)

---

### expert-continuous-delivery

Position: The design is acceptable for git hygiene if the state file is gitignored OR committed only at meaningful checkpoints, not after every stage write.

Reasoning: Committing a state file that is cleared and rebuilt every run creates churn in git history. Each run produces at minimum 2 commits: one to clear, one (or more) as stages complete. For a pipeline that runs frequently during active development, this adds noise to `git log` that is not meaningful to reviewers.

Two options:
1. **Gitignore the state file.** It is ephemeral by nature -- it exists only during a run and is cleared at the next run. Gitignoring it means no commit noise. The downside: no git history archive. But the questioner-session files, debate-session files, TLA+ specs, and implementation plans are all committed separately. The state file is metadata about those artifacts, not an artifact itself.
2. **Commit only at terminal states.** Commit the state file once when the pipeline reaches COMPLETE or HALTED. This gives one meaningful commit per run, not N commits for N stages. The cleared state is never committed -- it is transient.

Option 2 is the better fit for the stated design (git history as archive) while minimizing noise.

The session index elimination is fine -- the session index was a separate file that duplicated commit history. Removing it reduces maintenance.

Stale references: straightforward cleanup, no CD concerns.

Objections:
- Committing the state file after every stage write creates git noise disproportionate to the value of the archive. The design should specify commit frequency: terminal states only, not every write.

Endorsements:
- None (first round)

---

## Round 1 -- Moderator Analysis

**New objections raised in Round 1:**

1. expert-tdd: Section-scoped ownership is untestable without a parseable schema. Initial cleared state is unspecified.
2. expert-ddd: Generic naming instead of domain language (PipelineRunSnapshot, StageResult).
3. expert-tla: CLEARING state is unmodeled. Clear failure leaves the file in an undefined state.
4. expert-edge-cases: Partial write, clear failure, uncommitted state before clearing.
5. expert-continuous-delivery: Commit frequency is unspecified; committing every stage write creates noise.

**Overlap detected:**
- expert-tla's "CLEARING state" and expert-edge-cases' "clear failure" are the same concern from different lenses. Both recommend fail-fast on clear failure.
- expert-tdd's "initial cleared state" and expert-tla's CLEARED state definition are related -- what does the file look like after clearing?

**No consensus yet -- new objections exist. Proceeding to Round 2.**

---

## Round 2

### expert-tdd

Position: Unchanged. The schema concern stands. I endorse expert-ddd's naming recommendation -- "StageResult" gives tests a natural assertion target.

Reasoning: If each section is a StageResult with a defined structure (status, paths, timestamps), then a test can assert: "after Stage 1 completes, pipeline-state.md contains exactly one StageResult with stage=1, status=COMPLETE, and a valid briefing path." That is a clean, deterministic assertion. Without the schema, the test has to do fragile markdown parsing.

I also endorse expert-continuous-delivery's terminal-state-only commit model. From a TDD perspective, the state file is a work-in-progress during a run -- committing intermediate states is like committing code between RED and GREEN. Commit at COMPLETE or HALTED.

For the initial state: the cleared file should contain section headers with empty values (a template), not an empty file. This gives agents a known structure to write into and gives tests a known initial state to assert against.

Objections:
- None new. Prior objections (schema, initial state) are addressed if the recommendations are adopted.

Endorsements:
- expert-ddd: "StageResult" naming makes the ownership invariant testable by giving sections a typed identity.
- expert-continuous-delivery: Terminal-state-only commits. Intermediate state is work-in-progress, not archival.

---

### expert-ddd

Position: Unchanged on naming. I endorse expert-tdd's schema recommendation -- a typed contract for StageResult is the natural implementation of domain-driven section ownership.

Reasoning: expert-tdd's request for a parseable schema and my request for domain naming converge: define a StageResult value object with explicit fields (stage, status, artifactPath, timestamp), and the section-scoped ownership invariant becomes a domain rule rather than a convention. Each stage constructs its own StageResult and writes it to its designated section. The domain language and the enforcement mechanism are the same thing.

I accept expert-tla's state model (ABSENT, CLEARED, ACCUMULATING, COMPLETE_SNAPSHOT, HALTED_SNAPSHOT) as the correct enumeration. These should be the valid values for the file-level status field.

On the stale references: the accumulated_context table in SKILL.md should be updated. Stage 1 row should read "briefing" only (drop "expert list"). Stages 2 and 4 should not reference an expert list passed from Stage 1 -- the debate-moderator selects experts autonomously.

Objections:
- None new. Prior naming objection is addressed if StageResult naming is adopted.

Endorsements:
- expert-tdd: Typed schema for sections. This is the implementation of domain-driven ownership.
- expert-tla: State enumeration (ABSENT, CLEARED, ACCUMULATING, COMPLETE_SNAPSHOT, HALTED_SNAPSHOT) is the correct model.

---

### expert-tla

Position: Satisfied. The fail-fast recommendation from edge-cases addresses the CLEARING state concern.

Reasoning: If the clear operation fails and the pipeline does not start (fail-fast), then the CLEARING state is transient and never observable by downstream agents. The state model becomes:
- ClearAttempt -> either CLEARED (success) or PIPELINE_NOT_STARTED (failure)
- PIPELINE_NOT_STARTED is terminal -- no further transitions.

This is clean. The safety property ClearOnStart is preserved: no run begins with stale state.

I endorse expert-tdd's template-based initial state. A CLEARED file with section headers and empty values is a well-defined initial state that makes ClearOnStart verifiable.

I endorse expert-continuous-delivery's terminal-state-only commit model. From a formal perspective, intermediate states are transient and should not be durably recorded in the archive. Only terminal states (COMPLETE_SNAPSHOT, HALTED_SNAPSHOT) are meaningful for archival.

Objections:
- None new. Prior CLEARING state objection is addressed by fail-fast.

Endorsements:
- expert-edge-cases: Fail-fast on clear failure. This resolves the CLEARING state concern.
- expert-tdd: Template-based initial state. Makes CLEARED a well-defined, verifiable state.
- expert-continuous-delivery: Terminal-state-only commits. Only terminal states are archivally meaningful.

---

### expert-edge-cases

Position: Satisfied on clear failure (fail-fast). Two refinements on the other edge cases.

Reasoning: The fail-fast on clear failure is endorsed by the council. Good.

On partial write: expert-tdd's schema proposal implicitly addresses this -- if each stage validates the state file structure before writing (checking that all prior StageResult sections are well-formed), a truncated section from a prior crash will be caught. This is a lightweight guard that costs almost nothing.

On uncommitted state before clearing: expert-continuous-delivery's terminal-state-only commit model helps but does not fully address this. If a pipeline run reaches HALTED but the user does not commit, the next run clears the file. Recommendation: the clear operation should check for uncommitted changes and warn (not block -- the user may intentionally want to discard a halted run's state). A `git status` check on the state file before clearing is sufficient.

Objections:
- None new. Prior objections are addressed by the schema validation (partial write) and the commit model + uncommitted-change warning (archival gap).

Endorsements:
- expert-tdd: Schema validation implicitly catches partial writes from prior crashes.
- expert-continuous-delivery: Terminal-state-only commits reduce archival gaps.

---

### expert-continuous-delivery

Position: Satisfied. Terminal-state-only commits are endorsed by the council.

Reasoning: The convergence on terminal-state-only commits (COMPLETE or HALTED) resolves the git noise concern. One commit per pipeline run is clean and meaningful.

expert-edge-cases' recommendation to check for uncommitted changes before clearing is a good CI hygiene practice. It does not need to block -- a warning is sufficient. The user can choose to commit or discard.

On the session index elimination: the combination of terminal-state-only commits and the state file's StageResult structure provides equivalent queryability to the old session index. `git log --oneline -- docs/pipeline-state.md` gives you the run history. Reading any commit's version of the file gives you the full stage breakdown. This is better than a separate index file that can drift.

Objections:
- None new. Prior commit frequency objection is resolved.

Endorsements:
- expert-edge-cases: Uncommitted-change warning before clearing. Good CI hygiene.
- expert-tdd: Schema-based sections make the state file self-documenting and queryable -- equivalent to the old session index.

---

## Round 2 -- Moderator Analysis

**New objections raised in Round 2:** None.

All prior objections are either resolved by adopted recommendations or endorsed by other experts. No expert raised a new concern.

**Consensus reached after Round 2.**

---

## Agreed Recommendation

The council endorses the Global Pipeline State File design with the following refinements:

### 1. State File Structure: Template-Based Clearing with Typed Sections

The file at `docs/pipeline-state.md` is cleared at the start of each run to a **template** (not empty). The template contains section headers for each stage with empty/default values. Each section is a **StageResult** with defined fields: stage identifier, status, artifact path(s), and timestamp.

### 2. Domain Naming

Use domain language throughout:
- The state file represents a **PipelineRunSnapshot**
- Each section is a **StageResult**
- File-level status values: CLEARED, ACCUMULATING, COMPLETE, HALTED
- Section-scoped ownership is a domain invariant: each stage writes only its own StageResult

### 3. Fail-Fast on Clear Failure

If the clear operation (writing the template) fails for any reason (disk full, permission error, file locked), the pipeline does not start. This preserves the ClearOnStart safety property.

### 4. Uncommitted-Change Warning

Before clearing, check `git status` on the state file. If there are uncommitted changes, warn the user (do not block). This prevents silent loss of archival data when git-history-as-archive is the archival strategy.

### 5. Terminal-State-Only Commits

The state file is committed only when the pipeline reaches COMPLETE or HALTED -- not after every stage write. Intermediate states are transient and not committed. This produces one meaningful commit per pipeline run, avoiding git noise.

### 6. Schema Validation

Each stage should validate that the state file is well-formed (all prior StageResult sections exist and are parseable) before writing its own section. This catches partial writes from agent crashes at near-zero cost.

### 7. Session Index Elimination

The `docs/design-pipeline-sessions/` directory is eliminated. The state file + git history replaces it. `git log -- docs/pipeline-state.md` provides run history; reading any commit's version provides the full stage breakdown.

### 8. Stale Expert-Selection References Cleanup

The following changes are required in `.claude/skills/design-pipeline/SKILL.md`:

**Stage 1 framing (lines 155-161):** Remove the "Expert Council" section instruction. The questioner no longer selects experts. Replace with:

```
You are being called from the /design-pipeline orchestrator. This is a pipeline run. After sign-off, save the briefing file but do not dispatch any downstream agents. Return the briefing content and file path to the caller.
```

**Stage 1 output description (line 163):** Change from "Briefing file path + briefing content including the Expert Council section" to "Briefing file path + briefing content."

**Stage 1 on-completion (line 164):** Remove "Extract the expert list from the Expert Council section." Remove "Add briefing and expert list to accumulated context." Replace with "Add briefing to accumulated context."

**Stage 2 input (line 174):** Remove the `Experts:` line ("The expert list confirmed in Stage 1"). The debate-moderator selects experts autonomously via selectExperts(topic).

**Stage 4 input (line 242):** Remove the `Experts:` line ("The same expert list from Stage 1"). The debate-moderator selects experts autonomously.

**Accumulated context table (lines 136-143):** Remove "expert list" from the "After Stage 1" row and all subsequent rows.

**Stage 1 diagram label (line 29):** Change from "elicit requirements + expert selection" to "elicit requirements."

**Constraints section (line 713):** Remove "Expert selection from Stage 1 is reused in both Stage 2 and Stage 4 -- the same council reviews from start to finish."

**Description in frontmatter (line 3):** Remove references to expert selection from the description if present.

### 9. Variables-Only Content Model Confirmed

The council agrees that paths, timestamps, status flags, and stage identifiers are sufficient. No expert identified a concrete scenario requiring richer state. If a future need arises, the StageResult structure can be extended without redesigning the file.

### 10. Corruption as Non-Concern Confirmed (with Guards)

Sequential execution eliminates concurrent-write corruption. The fail-fast on clear failure and schema validation before writes address the two realistic edge cases (clear failure, partial write from crash). No further corruption guards are needed.

---

## Expert Final Positions

**expert-tdd**
Position: Endorse the design with schema-based sections and template-based clearing.
Key reasoning: The state file is testable if and only if sections have a defined, parseable structure. The StageResult schema makes section-scoped ownership a testable invariant. Template-based clearing provides a known initial state for assertions. Terminal-state-only commits prevent committing work-in-progress.
Endorsed: expert-ddd (StageResult naming), expert-continuous-delivery (terminal-state-only commits)

**expert-ddd**
Position: Endorse the design with domain naming (PipelineRunSnapshot, StageResult) and accumulated_context cleanup.
Key reasoning: The state file is a proper domain artifact when named and structured using domain language. The separation of SKILL.md (behavioral spec), accumulated_context (event log), and pipeline-state.md (current snapshot) is a clean bounded-context separation. The stale expert-selection references in SKILL.md violate the current domain model and must be cleaned up.
Endorsed: expert-tdd (typed schema), expert-tla (state enumeration)

**expert-tla**
Position: Endorse the design. The state model is complete with the fail-fast addition.
Key reasoning: The state file's lifecycle (ABSENT -> CLEARED -> ACCUMULATING -> COMPLETE_SNAPSHOT or HALTED_SNAPSHOT) is a well-defined state machine with no implicit states once fail-fast is added for the clear operation. Safety properties (SectionOwnership, NoStageSkip, ClearOnStart) are enforceable. Liveness (Progress) is guaranteed by the pipeline's existing halt/complete terminal states.
Endorsed: expert-edge-cases (fail-fast), expert-tdd (template initial state), expert-continuous-delivery (terminal-state-only commits)

**expert-edge-cases**
Position: Endorse the design with fail-fast, schema validation, and uncommitted-change warning.
Key reasoning: The three edge cases (partial write, clear failure, uncommitted state) are all addressed by lightweight guards. No heavy infrastructure is needed. The sequential execution model eliminates the concurrency class of edge cases entirely. The remaining edge cases are all single-agent failure modes addressed by fail-fast and validation.
Endorsed: expert-tdd (schema validation catches partial writes), expert-continuous-delivery (terminal-state-only commits)

**expert-continuous-delivery**
Position: Endorse the design with terminal-state-only commits and uncommitted-change warning.
Key reasoning: One commit per pipeline run (at COMPLETE or HALTED) is clean git hygiene. The state file's StageResult structure provides equivalent queryability to the eliminated session index. The uncommitted-change warning before clearing is a low-cost safety net for the git-history-as-archive strategy.
Endorsed: expert-edge-cases (uncommitted-change warning), expert-tdd (schema makes state file queryable)

---

## Endorsement Map

| Expert | Endorsed By |
|---|---|
| expert-tdd (schema, template initial state) | expert-ddd, expert-tla, expert-edge-cases, expert-continuous-delivery |
| expert-ddd (StageResult naming) | expert-tdd |
| expert-tla (state enumeration) | expert-ddd |
| expert-edge-cases (fail-fast, uncommitted warning) | expert-tla, expert-continuous-delivery |
| expert-continuous-delivery (terminal-state-only commits) | expert-tdd, expert-tla, expert-edge-cases |

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-design.md
