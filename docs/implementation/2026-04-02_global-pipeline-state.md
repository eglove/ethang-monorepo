# Implementation Plan: Global Pipeline State File

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-02_global-pipeline-state.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-design.md` |
| TLA+ Specification | `docs/tla-specs/global-pipeline-state/GlobalPipelineState.tla` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-02_global-pipeline-state-tla-review-v2.md` |

## TLA+ State Coverage Matrix

### States

**File Lifecycle (Machine 1):**
- `ABSENT` -- file does not exist (before first pipeline run)
- `CLEARED` -- template written with section headers and empty values
- `ACCUMULATING` -- at least one stage has written its StageResult
- `COMPLETE_SNAPSHOT` -- pipeline completed successfully
- `HALTED_SNAPSHOT` -- pipeline halted due to failure

**Section States (Machine 2):**
- `EMPTY` -- section header present, no content
- `WRITTEN` -- populated by owning stage
- `VALIDATED` -- validated by a subsequent stage before writing

**Git States (Machine 3):**
- `CLEAN` -- no uncommitted changes (initial only)
- `DIRTY` -- state file has uncommitted changes
- `COMMITTED` -- terminal state committed to git

**Boolean Flags:**
- `clearFailed` -- whether the clear operation failed (TRUE = intentional deadlock / fail-fast)
- `halted` -- whether current run halted
- `warned` -- whether uncommitted-change warning was issued

### Transitions

- `ClearStateFile` -- clear the state file to template at run start (ABSENT/COMPLETE_SNAPSHOT/HALTED_SNAPSHOT -> CLEARED, or sets clearFailed=TRUE)
- `StartRun` -- begin pipeline execution (CLEARED -> currentStage=1)
- `WriteStageResult(stage)` -- a stage writes its own section (CLEARED/ACCUMULATING -> ACCUMULATING)
- `ValidateSection(stage)` -- validate a prior stage's section before writing (WRITTEN -> VALIDATED)
- `AdvanceStage` -- move to the next stage (currentStage increments)
- `CompletePipeline` -- pipeline completes successfully (ACCUMULATING -> COMPLETE_SNAPSHOT)
- `HaltPipeline` -- pipeline halts (CLEARED/ACCUMULATING -> HALTED_SNAPSHOT)
- `WarnUncommitted` -- warn about uncommitted changes before clearing (sets warned=TRUE)
- `CommitStateFile` -- commit at terminal state only (DIRTY -> COMMITTED)

### Safety Invariants

- `TypeOK` -- all variables within declared domains
- `SectionOwnership` -- each stage's section is written only by its owning stage (writtenBy[s] is 0 or s)
- `NoStageSkip` -- stage N written only after all stages 1..(N-1) are written
- `ClearOnStart` -- when a run is active, all unwritten sections are EMPTY
- `FailFastOnClearFailure` -- if clear failed, pipeline does not start (clearFailed=TRUE => currentStage=0)
- `SchemaValidationInvariant` -- when a stage writes, all prior stages are populated
- `TerminalStateOnlyCommit` -- state file committed only at COMPLETE_SNAPSHOT or HALTED_SNAPSHOT
- `UncommittedWarningProtocol` -- warned=TRUE only when gitState is DIRTY or COMMITTED
- `ClearedSectionsEmpty` -- when fileState is CLEARED, every section is EMPTY
- `HaltedConsistency` -- halted=TRUE if and only if fileState=HALTED_SNAPSHOT

### Liveness Properties

- `Progress` -- if a pipeline run starts (CLEARED), it eventually reaches COMPLETE_SNAPSHOT or HALTED_SNAPSHOT
- `EventualCommit` -- if the file reaches a terminal state, it is eventually committed

---

## Implementation Steps

### Step 1: Create the pipeline-state.md template file

**Files:**
- `docs/pipeline-state.md` (create)

**Description:**
Create the state file at its canonical location with the template structure. The template represents the CLEARED state: it contains section headers for the pipeline run metadata and each of the 6 stages, with empty/default values. Each section uses domain language -- the file-level concept is a PipelineRunSnapshot, and each stage section is a StageResult. The template must be deterministic so that clearing the file means overwriting with this exact content.

The template structure includes:
- A header identifying this as the pipeline state file
- Run-level metadata: run status (CLEARED), topic, start timestamp, current stage
- One StageResult section per stage (1-6), each with: stage name, status (empty), artifact path (empty), timestamp (empty)
- A Git Commit section: committed (no), halt reason (empty)

**Dependencies:** None

**Test (write first):**
Write a test that reads `docs/pipeline-state.md` and asserts:
1. The file exists
2. It contains exactly 6 StageResult sections (identifiable by a consistent heading pattern like `## Stage N --`)
3. Each StageResult section contains the fields: Status, Artifact, Timestamp -- all with empty/default values
4. The run-level metadata section exists with Status field set to `CLEARED`
5. A Git Commit section exists with Committed field set to `no`

The test parses the markdown by splitting on `##` headings and checking field patterns. Inputs: the file on disk. Expected outcome: all assertions pass against the template content.

**TLA+ Coverage:**
- State: `ABSENT` (before file exists -- test verifies creation from nothing)
- State: `CLEARED` (the template IS the CLEARED state)
- State: `EMPTY` (all sections are EMPTY in the template)
- Transition: `ClearStateFile` (the template is what ClearStateFile produces)
- Invariant: `ClearedSectionsEmpty` (template has all sections empty)
- Invariant: `TypeOK` (the template establishes the initial shape)

---

### Step 2: Clean stale expert-selection references from design-pipeline SKILL.md

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Remove all references to expert selection being a questioner/Stage 1 responsibility. After PR #40, expert selection is the debate-moderator's autonomous `selectExperts(topic)` function. The following specific changes are required (per design consensus item 8):

1. **Frontmatter description (line 3):** Remove "expert selection" language if present
2. **Pipeline stages diagram (line 29):** Change Stage 1 label from "elicit requirements + expert selection" to "elicit requirements"
3. **Stage 1 input framing (lines 155-161):** Remove the Expert Council section instruction. Replace with simplified framing that just asks the questioner to save the briefing and return it
4. **Stage 1 output (line 163):** Remove "including the Expert Council section"
5. **Stage 1 on-completion (line 164-165):** Remove "Extract the expert list from the Expert Council section." Change "Add briefing and expert list to accumulated context" to "Add briefing to accumulated context"
6. **Stage 2 input (line 174):** Remove the `Experts:` parameter line
7. **Stage 4 input (line 242):** Remove the `Experts:` parameter line
8. **Accumulated context table (lines 136-143):** Remove "expert list" from Stage 1 row and all subsequent rows
9. **Constraints section (line 713):** Remove the constraint about expert selection reuse across stages

**Dependencies:** None

**Test (write first):**
Write a test that reads `.claude/skills/design-pipeline/SKILL.md` and asserts:
1. The file does NOT contain the string "Expert Council" (case-sensitive)
2. The file does NOT contain "expert list" as a table cell value in the accumulated context table
3. The file does NOT contain "expert selection" in the frontmatter description
4. The Stage 1 diagram label does NOT contain "expert selection"
5. The file does NOT contain the constraint "Expert selection from Stage 1 is reused"
6. The Stages 2 and 4 input sections do NOT contain an `Experts:` parameter line that references Stage 1

Inputs: the SKILL.md file content. Expected outcome: all negative assertions pass (none of the stale references exist).

**TLA+ Coverage:**
- This step does not directly map to a TLA+ state or transition. It is a prerequisite cleanup required by the design consensus (item 8) that removes stale documentation from the file that will receive state-file lifecycle instructions in Step 4.

---

### Step 3: Shed state documentation from design-pipeline SKILL.md

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Remove the state-tracking documentation from SKILL.md that is being replaced by the state file. The SKILL.md should focus purely on behavioral instructions. Specifically:

1. **Pipeline Change Tracking section (lines 118-130):** Remove the `changeFlag` description. The changeFlag concept remains in the pipeline but its documentation moves to the state file where the flag lives.
2. **Accumulated Context table (lines 136-143):** Remove the table entirely. The state file tracks what context has been accumulated. The behavioral instructions for what each stage passes forward remain in the stage execution sections.
3. **Session File section (lines 558-628):** Remove the entire Session File section including the format template. The state file replaces the session index.
4. **Session File format description and output location for Pipeline Session Index:** Remove the row from the Output Locations table (line 662) referencing `docs/design-pipeline-sessions/`.
5. **Handoff section references to session index:** Update to reference the state file instead of the session index.

**Dependencies:** Step 2 (expert-selection cleanup must happen first so we are working on a clean file)

**Test (write first):**
Write a test that reads `.claude/skills/design-pipeline/SKILL.md` and asserts:
1. The file does NOT contain the heading `## Pipeline Change Tracking` (the section is removed)
2. The file does NOT contain the heading `## Accumulated Context` as a standalone section with a table (behavioral stage instructions may still reference accumulated context as a concept)
3. The file does NOT contain the heading `### Session File Format`
4. The file does NOT contain `docs/design-pipeline-sessions/` anywhere
5. The file does NOT contain `Pipeline Session Index` in the Output Locations table
6. The file DOES still contain stage execution sections (Stage 1 through Stage 6) -- we only removed state docs, not behavior docs

Inputs: the SKILL.md file content. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- This step removes the old state-tracking approach, making room for the state file. It is a prerequisite for Step 4 which adds state-file lifecycle instructions.
- Indirectly supports all Machine 1 states by establishing that the state file (not SKILL.md) is the single source of truth.

---

### Step 4: Add state file lifecycle instructions to design-pipeline SKILL.md

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add a new section to SKILL.md documenting the state file lifecycle and the orchestrator's responsibilities. This section replaces the removed state documentation with behavioral instructions for how the orchestrator interacts with the state file. The content covers:

1. **State File Location:** `docs/pipeline-state.md`
2. **Clear on Start:** At the start of each pipeline run, overwrite the state file with the template (CLEARED state). If the clear operation fails, do not start the pipeline (fail-fast).
3. **Uncommitted-Change Warning:** Before clearing, check `git status` on the state file. If there are uncommitted changes (DIRTY), warn the user. Do not block -- warn only.
4. **Section Ownership:** Each stage writes only its own StageResult section. Cross-section writes are domain invariant violations.
5. **Schema Validation:** Each stage validates that the state file is well-formed (all prior StageResult sections are present and parseable) before writing its own section.
6. **Terminal-State-Only Commits:** The state file is committed only when the pipeline reaches COMPLETE or HALTED. Intermediate states are transient.
7. **Session Index Elimination:** Note that the `docs/design-pipeline-sessions/` directory has been eliminated. The state file + git history replaces it.
8. **Update the COMPLETE and HALTED presentation blocks** to reference the state file path instead of the session index path.
9. **Update Output Locations table** to include the state file and remove the session index entry.

**Dependencies:** Step 1 (template must exist), Step 3 (state docs must be removed first)

**Test (write first):**
Write a test that reads `.claude/skills/design-pipeline/SKILL.md` and asserts:
1. The file contains a section about the state file (heading containing "State File" or "Pipeline State")
2. That section contains the string `docs/pipeline-state.md`
3. The file contains the phrase "fail-fast" in the context of clear failure
4. The file contains the phrase "section ownership" or "SectionOwnership" or "section-scoped ownership"
5. The file contains the phrase "schema validation" or "validates" in the context of prior stages
6. The file contains the phrase "terminal" in the context of commits (terminal-state-only commits)
7. The file contains "uncommitted" in the context of warning before clearing
8. The Output Locations table includes `docs/pipeline-state.md`
9. The COMPLETE presentation block references the state file path
10. The HALTED presentation block references the state file path

Inputs: the SKILL.md file content. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- Transition: `ClearStateFile` (clear on start instruction)
- Transition: `WarnUncommitted` (uncommitted-change warning instruction)
- Transition: `CommitStateFile` (terminal-state-only commit instruction)
- Invariant: `FailFastOnClearFailure` (fail-fast instruction)
- Invariant: `SectionOwnership` (section ownership instruction)
- Invariant: `SchemaValidationInvariant` (schema validation instruction)
- Invariant: `TerminalStateOnlyCommit` (terminal-state-only commit instruction)
- Invariant: `UncommittedWarningProtocol` (uncommitted warning instruction)
- Invariant: `ClearOnStart` (clear on start instruction)
- State: `CLEARED` (template-based clearing)
- State: `COMPLETE_SNAPSHOT` (terminal state handling)
- State: `HALTED_SNAPSHOT` (terminal state handling)

---

### Step 5: Add state file write instructions to questioner SKILL.md (Stage 1)

**Files:**
- `.claude/skills/questioner/SKILL.md` (modify)

**Description:**
Add instructions to the questioner skill telling it to write its StageResult section in `docs/pipeline-state.md` when called from the design pipeline. The questioner writes the Stage 1 section with: status (COMPLETE or INCOMPLETE), artifact path (briefing file path), and timestamp. The questioner must validate that the state file exists and is in CLEARED or ACCUMULATING state before writing. The questioner writes only to its own section -- the Stage 1 StageResult.

This instruction should be conditioned on being called from the design pipeline (the questioner is also used standalone). A pipeline-run flag or the presence of the state file in CLEARED state indicates pipeline context.

**Dependencies:** Step 1 (template must exist)

**Test (write first):**
Write a test that reads `.claude/skills/questioner/SKILL.md` and asserts:
1. The file contains a reference to `docs/pipeline-state.md` or `pipeline-state.md`
2. The file contains instructions about writing a StageResult (the term "StageResult" or "Stage 1" section in the state file)
3. The file contains a condition for pipeline context (e.g., "when called from the design pipeline" or "pipeline run")

Inputs: the SKILL.md file content. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- Transition: `WriteStageResult(1)` (Stage 1 writes its section)
- State: `WRITTEN` (section state after questioner writes)
- Invariant: `SectionOwnership` (questioner writes only Stage 1)
- Invariant: `NoStageSkip` (Stage 1 has no prior stages to check)

---

### Step 6: Add state file write instructions to debate-moderator SKILL.md (Stages 2 and 4)

**Files:**
- `.claude/skills/orchestrators/debate-moderator/SKILL.md` (modify)

**Description:**
Add instructions to the debate-moderator skill telling it to write StageResult sections in `docs/pipeline-state.md` when called from the design pipeline. The debate-moderator is used for two stages:

- **Stage 2 (Design Debate):** Writes the Stage 2 StageResult with: status (CONSENSUS REACHED or PARTIAL CONSENSUS), artifact path (debate session file path), rounds count, and timestamp.
- **Stage 4 (TLA+ Review):** Writes the Stage 4 StageResult with: status (CONSENSUS REACHED or OBJECTIONS NOTED), artifact path (review session file path), rounds count, and timestamp.

Before writing, the debate-moderator validates that all prior StageResult sections are present and well-formed (schema validation). The debate-moderator writes only to its own stage's section -- Stage 2 or Stage 4, depending on which pipeline stage dispatched it.

**Dependencies:** Step 1 (template must exist), Step 5 (Stage 1 must write first in execution order, but the file modification is independent)

**Test (write first):**
Write a test that reads `.claude/skills/orchestrators/debate-moderator/SKILL.md` and asserts:
1. The file contains a reference to `docs/pipeline-state.md` or `pipeline-state.md`
2. The file contains instructions about writing Stage 2 and Stage 4 StageResult sections
3. The file contains instructions about validating prior sections before writing

Inputs: the SKILL.md file content. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- Transition: `WriteStageResult(2)` (Stage 2 writes its section)
- Transition: `WriteStageResult(4)` (Stage 4 writes its section)
- Transition: `ValidateSection(s)` (debate-moderator validates prior sections)
- State: `WRITTEN` (section state after debate-moderator writes)
- State: `VALIDATED` (prior sections validated before writing)
- Invariant: `SectionOwnership` (debate-moderator writes only its assigned stage)
- Invariant: `NoStageSkip` (validates prior stages exist)
- Invariant: `SchemaValidationInvariant` (validates prior sections are well-formed)

---

### Step 7: Add state file write instructions to tla-writer AGENT.md (Stage 3)

**Files:**
- `.claude/skills/tla-writer/AGENT.md` (modify)

**Description:**
Add instructions to the tla-writer agent telling it to write its StageResult section in `docs/pipeline-state.md` when called from the design pipeline. The tla-writer writes the Stage 3 StageResult with: status (COMPLETE or UNVERIFIED), artifact path (TLA+ spec directory path), TLC result (PASS or FAIL), retry count, and timestamp. Before writing, the tla-writer validates that all prior StageResult sections (Stages 1-2) are present and well-formed.

**Dependencies:** Step 1 (template must exist)

**Test (write first):**
Write a test that reads `.claude/skills/tla-writer/AGENT.md` and asserts:
1. The file contains a reference to `docs/pipeline-state.md` or `pipeline-state.md`
2. The file contains instructions about writing a Stage 3 StageResult section
3. The file contains instructions about validating prior sections before writing

Inputs: the AGENT.md file content. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- Transition: `WriteStageResult(3)` (Stage 3 writes its section)
- Transition: `ValidateSection(s)` (tla-writer validates prior sections)
- State: `WRITTEN` (section state after tla-writer writes)
- Invariant: `SectionOwnership` (tla-writer writes only Stage 3)
- Invariant: `NoStageSkip` (validates Stages 1-2 exist)
- Invariant: `SchemaValidationInvariant` (validates prior sections are well-formed)

---

### Step 8: Add state file write instructions to implementation-writer AGENT.md (Stage 5)

**Files:**
- `.claude/skills/implementation-writer/AGENT.md` (modify)

**Description:**
Add instructions to the implementation-writer agent telling it to write its StageResult section in `docs/pipeline-state.md` when called from the design pipeline. The implementation-writer writes the Stage 5 StageResult with: status (COMPLETE), artifact path (implementation plan file path), tiers count, tasks count, unmapped states (list or "None"), and timestamp. Before writing, the implementation-writer validates that all prior StageResult sections (Stages 1-4) are present and well-formed.

**Dependencies:** Step 1 (template must exist)

**Test (write first):**
Write a test that reads `.claude/skills/implementation-writer/AGENT.md` and asserts:
1. The file contains a reference to `docs/pipeline-state.md` or `pipeline-state.md`
2. The file contains instructions about writing a Stage 5 StageResult section
3. The file contains instructions about validating prior sections before writing

Inputs: the AGENT.md file content. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- Transition: `WriteStageResult(5)` (Stage 5 writes its section)
- Transition: `ValidateSection(s)` (implementation-writer validates prior sections)
- State: `WRITTEN` (section state after implementation-writer writes)
- Invariant: `SectionOwnership` (implementation-writer writes only Stage 5)
- Invariant: `NoStageSkip` (validates Stages 1-4 exist)
- Invariant: `SchemaValidationInvariant` (validates prior sections are well-formed)

---

### Step 9: Add state file write instructions to design-pipeline SKILL.md for Stage 6

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add instructions within the Stage 6 section of the design-pipeline SKILL.md specifying that the orchestrator writes the Stage 6 StageResult section in `docs/pipeline-state.md`. The orchestrator writes Stage 6 with: status (COMPLETE or HALTED), integration branch name, tiers completed, tasks completed/total, global fix count, halt reason (if applicable), and timestamp. Before writing, validate that all prior StageResult sections (Stages 1-5) are present and well-formed.

Additionally, this step updates the terminal state handling (COMPLETE and HALTED presentation blocks) to:
1. Write the final file-level status (COMPLETE or HALTED) to the run metadata section
2. Commit the state file as part of the terminal artifact

**Dependencies:** Step 4 (state file lifecycle instructions must be in place)

**Test (write first):**
Write a test that reads `.claude/skills/design-pipeline/SKILL.md` and asserts:
1. The Stage 6 section contains a reference to writing the Stage 6 StageResult in `pipeline-state.md`
2. The COMPLETE block references committing the state file
3. The HALTED block references committing the state file
4. The Stage 6 section contains instructions about validating prior sections

Inputs: the SKILL.md file content. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- Transition: `WriteStageResult(6)` (Stage 6 writes its section)
- Transition: `CompletePipeline` (file-level status set to COMPLETE_SNAPSHOT)
- Transition: `HaltPipeline` (file-level status set to HALTED_SNAPSHOT)
- Transition: `CommitStateFile` (terminal commit at COMPLETE or HALTED)
- State: `COMPLETE_SNAPSHOT` (pipeline completes)
- State: `HALTED_SNAPSHOT` (pipeline halts)
- Invariant: `SectionOwnership` (orchestrator writes only Stage 6)
- Invariant: `NoStageSkip` (validates Stages 1-5 exist)
- Invariant: `TerminalStateOnlyCommit` (commit only at terminal states)
- Invariant: `HaltedConsistency` (halted flag and file state agree)

---

### Step 10: Integration test -- full state file lifecycle

**Files:**
- Test file alongside the state file validation tests (same test file as Steps 1, 5-9, extended)

**Description:**
Write an integration test that validates the full lifecycle of the state file by checking all SKILL.md and AGENT.md files together. This test ensures the entire pipeline's state file contract is coherent across all participating agents.

**Dependencies:** Steps 1-9 (all prior steps must be complete)

**Test (write first):**
Write an integration test that:
1. Reads all participating agent files (questioner SKILL.md, debate-moderator SKILL.md, tla-writer AGENT.md, implementation-writer AGENT.md, design-pipeline SKILL.md)
2. Asserts each file references `pipeline-state.md`
3. Asserts each file's stage number is mentioned in the context of StageResult writes
4. Asserts the design-pipeline SKILL.md contains fail-fast, uncommitted warning, terminal-state-only commit, and section ownership concepts
5. Asserts the template file (`docs/pipeline-state.md`) contains exactly 6 stage sections matching the 6 pipeline stages
6. Asserts no file references `docs/design-pipeline-sessions/` (session index eliminated)

Inputs: all agent/skill files + the template. Expected outcome: all assertions pass.

**TLA+ Coverage:**
- Invariant: `SectionOwnership` (all agents write only their own section)
- Invariant: `NoStageSkip` (sequential coverage validated)
- Invariant: `ClearOnStart` (template structure validated)
- Invariant: `FailFastOnClearFailure` (instruction presence validated)
- Invariant: `TerminalStateOnlyCommit` (instruction presence validated)
- Invariant: `UncommittedWarningProtocol` (instruction presence validated)
- Invariant: `SchemaValidationInvariant` (validation instruction presence validated)
- Liveness: `Progress` (all stages have write instructions, enabling forward progress)
- Liveness: `EventualCommit` (terminal commit instructions present)

---

## State Coverage Audit

### States

| State | Covered By |
|-------|-----------|
| `ABSENT` | Step 1 (test verifies creation from nothing) |
| `CLEARED` | Step 1 (template IS the CLEARED state), Step 4 (clear-on-start instruction) |
| `ACCUMULATING` | Steps 5-9 (each stage's WriteStageResult transitions to ACCUMULATING) |
| `COMPLETE_SNAPSHOT` | Step 9 (CompletePipeline transition), Step 4 (terminal handling) |
| `HALTED_SNAPSHOT` | Step 9 (HaltPipeline transition), Step 4 (terminal handling) |
| `EMPTY` | Step 1 (template sections are EMPTY) |
| `WRITTEN` | Steps 5-9 (each stage writes its section) |
| `VALIDATED` | Steps 6-9 (each stage validates prior sections) |
| `CLEAN` | Step 4 (initial git state, implicitly handled -- only at Init) |
| `DIRTY` | Step 4 (state file has uncommitted changes after any write) |
| `COMMITTED` | Step 4, Step 9 (terminal-state-only commit instruction) |
| `clearFailed=TRUE` | Step 4 (fail-fast instruction) |
| `halted=TRUE` | Step 9 (HALTED handling) |
| `warned=TRUE` | Step 4 (uncommitted-change warning instruction) |

### Transitions

| Transition | Covered By |
|-----------|-----------|
| `ClearStateFile` | Step 1 (template creation), Step 4 (clear-on-start instruction) |
| `StartRun` | Step 4 (lifecycle instructions -- pipeline starts after clearing) |
| `WriteStageResult(1)` | Step 5 |
| `WriteStageResult(2)` | Step 6 |
| `WriteStageResult(3)` | Step 7 |
| `WriteStageResult(4)` | Step 6 |
| `WriteStageResult(5)` | Step 8 |
| `WriteStageResult(6)` | Step 9 |
| `ValidateSection(s)` | Steps 6-9 (each validates prior sections) |
| `AdvanceStage` | Step 4 (lifecycle instructions -- stages advance sequentially) |
| `CompletePipeline` | Step 9 (terminal handling) |
| `HaltPipeline` | Step 9 (terminal handling) |
| `WarnUncommitted` | Step 4 (uncommitted-change warning instruction) |
| `CommitStateFile` | Step 4, Step 9 (terminal-state-only commit) |

### Safety Invariants

| Invariant | Verified By |
|-----------|------------|
| `TypeOK` | Step 1 (template establishes shape), Step 10 (integration test) |
| `SectionOwnership` | Steps 5-9 (each agent writes only its section), Step 10 |
| `NoStageSkip` | Steps 6-9 (validate prior stages), Step 10 |
| `ClearOnStart` | Step 1 (template), Step 4 (clear instruction), Step 10 |
| `FailFastOnClearFailure` | Step 4 (fail-fast instruction), Step 10 |
| `SchemaValidationInvariant` | Steps 6-9 (validate prior sections), Step 10 |
| `TerminalStateOnlyCommit` | Step 4 (terminal commit instruction), Step 9, Step 10 |
| `UncommittedWarningProtocol` | Step 4 (warning instruction), Step 10 |
| `ClearedSectionsEmpty` | Step 1 (template has all sections empty) |
| `HaltedConsistency` | Step 9 (halted handling aligns with file state) |

### Liveness Properties

| Property | Verified By |
|----------|------------|
| `Progress` | Step 10 (all stages have write instructions, enabling forward progress) |
| `EventualCommit` | Step 4 (terminal commit instruction), Step 9 (commit at COMPLETE/HALTED), Step 10 |

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Foundation (independent work -- no cross-dependencies)

These tasks can execute in parallel because they touch different files with no shared dependencies. Step 1 creates a new file; Steps 2 and 3 modify the same file but must be serialized (Step 3 depends on Step 2). Steps 5, 7, and 8 each modify different agent files.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Create pipeline-state.md template |
| T2 | Step 2 | Clean stale expert-selection references |

### Tier 2: SKILL.md state documentation (depends on Tier 1 -- Step 3 requires Step 2 complete)

Step 3 modifies the same file as Step 2 (design-pipeline SKILL.md) and depends on the expert-selection cleanup being done first. Steps 5, 7, and 8 modify independent agent files and can run in parallel.

| Task ID | Step | Title |
|---------|------|-------|
| T3 | Step 3 | Shed state documentation from SKILL.md |
| T4 | Step 5 | Add state file write instructions to questioner |
| T5 | Step 7 | Add state file write instructions to tla-writer |
| T6 | Step 8 | Add state file write instructions to implementation-writer |

### Tier 3: Lifecycle and remaining agents (depends on Tier 2 -- Steps 4, 6, 9 require prior SKILL.md changes)

Step 4 modifies design-pipeline SKILL.md after Step 3 has removed old state docs. Step 6 modifies debate-moderator SKILL.md (independent file). Step 9 modifies design-pipeline SKILL.md after Step 4. Steps 4 and 9 must be serialized (same file), but Step 6 can run in parallel with Step 4.

| Task ID | Step | Title |
|---------|------|-------|
| T7 | Step 4 | Add state file lifecycle instructions to SKILL.md |
| T8 | Step 6 | Add state file write instructions to debate-moderator |

### Tier 4: Stage 6 state file instructions (depends on Tier 3 -- Step 9 requires Step 4)

| Task ID | Step | Title |
|---------|------|-------|
| T9 | Step 9 | Add Stage 6 state file write instructions |

### Tier 5: Integration test (depends on all prior tiers)

| Task ID | Step | Title |
|---------|------|-------|
| T10 | Step 10 | Integration test -- full state file lifecycle |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Create pipeline-state.md template | 1 | trainer-writer | vitest-writer | None | Markdown template file is a Claude Code artifact; vitest validates structure |
| T2 | Clean stale expert-selection references | 1 | trainer-writer | vitest-writer | None | SKILL.md modification is a trainer-writer task; vitest asserts content |
| T3 | Shed state documentation from SKILL.md | 2 | trainer-writer | vitest-writer | T2 | Same SKILL.md file requires sequential modification after T2 |
| T4 | Add state file write instructions to questioner | 2 | trainer-writer | vitest-writer | T1 | Questioner SKILL.md is a Claude Code artifact; vitest validates content assertions |
| T5 | Add state file write instructions to tla-writer | 2 | trainer-writer | vitest-writer | T1 | AGENT.md is a Claude Code artifact; vitest validates content assertions |
| T6 | Add state file write instructions to implementation-writer | 2 | trainer-writer | vitest-writer | T1 | AGENT.md is a Claude Code artifact; vitest validates content assertions |
| T7 | Add state file lifecycle instructions to SKILL.md | 3 | trainer-writer | vitest-writer | T1, T3 | SKILL.md modification adding state file lifecycle section; vitest validates presence |
| T8 | Add state file write instructions to debate-moderator | 3 | trainer-writer | vitest-writer | T1 | Debate-moderator SKILL.md is independent of design-pipeline SKILL.md changes |
| T9 | Add Stage 6 state file write instructions | 4 | trainer-writer | vitest-writer | T7 | Builds on lifecycle instructions added in T7; same file (SKILL.md) |
| T10 | Integration test -- full lifecycle | 5 | trainer-writer | vitest-writer | T1-T9 | Cross-cutting integration test validates all agents and the template together |
