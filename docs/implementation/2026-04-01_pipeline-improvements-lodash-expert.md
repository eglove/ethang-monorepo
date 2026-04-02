# Implementation Plan: Pipeline Improvements — Autonomous Expert Selection, user_notes Signaling, Lodash Expert, and PlantUML Diagram

## Source Artifacts

| Artifact | Path |
|----------|------|
| Briefing | `docs/questioner-sessions/2026-04-01_pipeline-improvements-lodash-expert.md` |
| Design Consensus | `docs/debate-moderator-sessions/2026-04-01_pipeline-improvements-design.md` |
| TLA+ Specification | `docs/tla-specs/pipeline-improvements-lodash-expert/` |
| TLA+ Review Consensus | `docs/debate-moderator-sessions/2026-04-01_pipeline-improvements-tla-review.md` |

---

## TLA+ State Coverage Matrix

### States

**Machine 1 — UserNotesFile**
- `ABSENT` — file does not exist
- `EMPTY` — file exists but has zero bytes
- `HAS_ENTRIES` — file contains one or more agent-appended entries

**Machine 2 — AutonomousExpertSelection**
- `IDLE` — waiting for a new topic
- `SELECTING` — `selectExperts(topic)` in progress
- `SELECTED` — non-empty expert set chosen; ready for debate rounds
- `FAILED` — `selectExperts` returned empty set — hard precondition error

**Machine 3 — PumlUpdate**
- `IDLE` — no update in progress
- `PENDING` — `changeFlag = TRUE`; Stage 6 wrap-up has not begun atomic write
- `WRITING` — temp file written; awaiting rename
- `COMPLETE` — rename succeeded; `.puml` updated
- `FAILED` — rename failed; original `.puml` intact (`originalPumlSafe = TRUE`)

### Transitions

**Machine 1**
- `AppendEntry` — ABSENT/EMPTY/HAS_ENTRIES → HAS_ENTRIES (always succeeds; Amendment A2/A3)
- `UserDeleteEntries` — HAS_ENTRIES → ABSENT or EMPTY (user-only convention; Amendment A4)

**Machine 2**
- `ReceiveTopic` — IDLE → SELECTING
- `SelectionSucceeds` — SELECTING → SELECTED (guard: `selectExperts(topic) ≠ {}`)
- `SelectionFails` — SELECTING → FAILED (guard: `selectExperts(topic) = {}`; Amendment A1)
- `DebateComplete` — SELECTED → IDLE (any debate terminus)
- `AcknowledgeFailure` — FAILED → IDLE

**Machine 3**
- `PipelineStageModifiesStructure` — sets `changeFlag = TRUE` (only when IDLE and flag not yet set)
- `PipelineCompletes_ChangeFlagSet` — IDLE → PENDING (guard: `changeFlag = TRUE`; Amendment A5)
- `PipelineCompletes_NoChange` — no-op (guard: `changeFlag = FALSE`)
- `BeginAtomicWrite` — PENDING → WRITING (writes temp file; Amendment A6)
- `RenameSucceeds` — WRITING → COMPLETE
- `RenameFails` — WRITING → FAILED (`originalPumlSafe` remains `TRUE`)
- `PumlResetAfterComplete` — COMPLETE → IDLE (resets `changeFlag`)
- `PumlResetAfterFailure` — FAILED → IDLE (resets `changeFlag`)

### Safety Invariants

- `TypeOK` — all variables remain within declared domains
- `NotesStateConsistency` — `HAS_ENTRIES` iff entry sequence is non-empty; ABSENT/EMPTY iff sequence is empty
- `AppendAlwaysEnabled` — file state never blocks an append (no file state disables `AppendEntry`)
- `SelectionNonEmpty` — `SELECTED` state requires `selectedExperts ≠ {}`
- `FailedOnlyWhenNoMatch` — `FAILED` only when `selectExperts(topic) = {}`
- `SelectedExpertsOnlyWhenSelected` — non-empty expert set exists only in `SELECTED` state
- `AtomicWriteGuarantee` — `originalPumlSafe = TRUE` throughout all reachable states
- `TempBeforeRename` — `WRITING` state requires `tempFileExists = TRUE`
- `UpdateOnlyWhenChanged` — `PENDING`/`WRITING` states require `changeFlag = TRUE`
- `TempFileOnlyDuringWrite` — `tempFileExists = TRUE` only in `WRITING` state

### Liveness Properties

- `EventuallyResolved` — whenever `SELECTING`, eventually transitions to `SELECTED` or `FAILED`
- `EventuallyIdle_Selection` — after `SELECTED`, debate eventually completes and returns to `IDLE`
- `EventuallyUpdated` — when `PENDING`, puml eventually reaches `COMPLETE` or `FAILED`
- `EventuallyIdle_Puml` — after `COMPLETE` or `FAILED`, puml returns to `IDLE`

---

## Implementation Steps

### Step 1: Create `expert-lodash/SKILL.md`

**Files:**
- `.claude/skills/agents/expert-lodash/SKILL.md` (create)

**Description:**
Create a new expert agent for Lodash utilities — the ninth member of the fixed roster. This expert evaluates any topic through the lens of Lodash correctness, per-method tree-shakable imports, safe deep property access via `lodash/get`, and replacement of hand-rolled array/object operations. The file follows the identical SKILL.md structure used by all eight existing experts (frontmatter with `name`/`description`, Shared Values section, Role, When to Dispatch, Expected Inputs, Process, Output Format with standalone and debate variants, Characteristic Positions, Handoff). Tensions are written only for genuine domain disagreements (e.g., vs. expert-tdd on mocking lodash utilities; vs. expert-ddd on whether domain entities should expose lodash-shaped iteration helpers).

This step must be completed before Step 2 (debate-moderator roster update) because the roster table references the file path.

**Dependencies:** None

**Test (write first):**
Write a Vitest test that reads `.claude/skills/agents/expert-lodash/SKILL.md` as a string and asserts:
1. The frontmatter block contains `name: expert-lodash`.
2. The file contains a `## Role` heading.
3. The file contains a `## Shared Values` heading.
4. The file contains a `## When to Dispatch` heading.
5. The file contains a `## Expected Inputs` heading.
6. The file contains a `## Process` heading.
7. The file contains an `## Output Format` heading.
8. The file contains a `## Handoff` heading.
9. The file contains the string `lodash` at least once in the Role section.
10. The file does NOT contain `expert-tdd` frontmatter name (regression: correct file, not a copy).

**TLA+ Coverage:**
- Transition: `SelectionSucceeds` (the expert must exist in Roster before `selectExperts` can return it as part of a non-empty set)
- Invariant: `SelectionNonEmpty` (roster has at least one valid expert for any non-empty topic)

---

### Step 2: Update `debate-moderator/SKILL.md` — Add Autonomous Expert Selection and `user_notes.md` Annotation

**Files:**
- `.claude/skills/orchestrators/debate-moderator/SKILL.md` (modify)

**Description:**
Two additions to the debate-moderator:

**Addition 1 — Autonomous expert selection (replaces the "Expert selection is mandatory" halt-and-wait block):**
Replace the current logic that halts when no `--experts` argument is provided with a named pure-function mapping. When no experts are provided by the caller, the moderator maps the topic to experts by calling `selectExperts(topic)` — a named operator that scans the roster and returns the subset whose domains are relevant to the topic's keywords and context. If `selectExperts` returns an empty set, the moderator FAILS with a hard precondition error (never silently proceeds). Zero user confirmation prompts are ever issued in this path. The roster table gains `expert-lodash` as the ninth entry. Add a comment: "At-most-one-selection-per-debate — `selectExperts` is called once before round 1 and the result is fixed for all rounds."

**Addition 2 — Post-hoc `user_notes.md` annotation step:**
After the synthesis is written and the session file is saved (primary output complete), the moderator checks whether any needed expert domain was absent from the roster. If any expert domain was identified as needed but no roster member covers it, the moderator appends an entry to `docs/user_notes.md`. Rules: (a) check before write — normalize expert names to lowercase before checking the roster; (b) if the file is ABSENT or EMPTY, create it with the standard header `# User Notes — Agent Requests` first; (c) entries are append-only; (d) document that "entries are user-curated; no automatic deletion is performed by agents" (convention, not invariant); (e) do NOT block or delay the primary output for this step.

Entry format (four fields):
```
- requested_by: debate-moderator
  expert_needed: <lowercase-normalized name>
  rationale: <why this domain is needed>
  source_session: <session filename>
```

Deduplication key for read-time: `(expert_needed, source_session)`. Entries identical across these two fields are considered duplicates and need not be re-appended if an identical entry already exists (best-effort — not a hard invariant given TOCTOU).

**Dependencies:** Step 1 (expert-lodash must exist to be added to roster)

**Test (write first):**
Write Vitest tests covering:
1. **Roster table contains `expert-lodash`** — assert the SKILL.md string contains `expert-lodash` in the table.
2. **Autonomous selection section exists** — assert the SKILL.md contains a section or heading referencing autonomous expert selection logic.
3. **No halt-on-missing-experts block** — assert the SKILL.md does NOT contain the phrase "Then stop. Do not proceed until an explicit selection is received." (the old halt behavior).
4. **Hard failure on empty selection** — assert the SKILL.md contains text describing a hard precondition error when `selectExperts` returns an empty set.
5. **user_notes.md annotation section exists** — assert the SKILL.md contains a section describing the post-hoc annotation step.
6. **Standard header documented** — assert the SKILL.md contains the exact header string `# User Notes — Agent Requests`.
7. **Convention language** — assert the SKILL.md contains "entries are user-curated" (not "only the user may delete" — the weaker, convention-only phrasing).
8. **ABSENT/EMPTY guard** — assert the SKILL.md describes handling of both ABSENT and EMPTY file states (Amendment A3).

**TLA+ Coverage:**
- States: `IDLE`, `SELECTING`, `SELECTED`, `FAILED` (Machine 2); `ABSENT`, `EMPTY`, `HAS_ENTRIES` (Machine 1)
- Transitions: `ReceiveTopic`, `SelectionSucceeds`, `SelectionFails`, `AppendEntry`
- Invariants: `SelectionNonEmpty`, `FailedOnlyWhenNoMatch`, `SelectedExpertsOnlyWhenSelected`, `NotesStateConsistency`, `AppendAlwaysEnabled`
- Liveness: `EventuallyResolved`

---

### Step 3: Update `questioner/SKILL.md` — Remove Branch 11

**Files:**
- `.claude/skills/questioner/SKILL.md` (modify)

**Description:**
Remove branch 11 (Expert council) from the Decision Tree in Phase 2. After the removal, the questioner's Decision Tree ends at branch 10 (Scope and edge cases). The Phase 3 sign-off recap is updated to remove "expert council recommendation" from the listed recap fields — the recap now covers: purpose, artifact type, trigger, inputs, outputs, handoff, name, and scope only. The Output Format session file template is updated: the `## Expert Council` section (Included/Excluded sub-sections) is removed from the session file schema. The `## Debate Requested` field remains.

After removal, explicitly name the questioner's remaining domain responsibilities in the file's role description so the agent's domain model is not left implicit: the questioner's job is full requirements elicitation (branches 1–10) and sign-off, not expert curation.

The Decision Guide row "User adjusts expert list during sign-off | Update the recommendation to match; re-confirm before proceeding" is removed (it no longer applies).

**Dependencies:** None (can proceed in parallel with Steps 1 and 2)

**Test (write first):**
Write Vitest tests covering:
1. **Decision Tree has 10 branches** — parse SKILL.md and assert branches are numbered 1 through 10 (no branch 11).
2. **No "Expert council" in Decision Tree** — assert the Decision Tree section does NOT contain "Expert council".
3. **Sign-off recap excludes expert council** — assert the Phase 3 section does NOT contain "expert council recommendation".
4. **Session file template lacks Expert Council section** — assert the Output Format section does NOT contain `## Expert Council`.
5. **Debate Requested field still present** — assert the session file template still contains `## Debate Requested`.
6. **Role description names remaining responsibilities** — assert the questioner's role/description section contains text describing requirements elicitation through branches 1–10.

**TLA+ Coverage:**
- State: `IDLE` (Machine 2 — the questioner no longer populates `selectedExperts`; that is now fully the debate-moderator's responsibility before round 1)
- Transition: `ReceiveTopic` (the topic reaches the debate-moderator clean, without a pre-selected expert list from the questioner)

---

### Step 4: Update `implementation-writer/AGENT.md` — Add Post-Hoc `user_notes.md` Annotation Step

**Files:**
- `.claude/skills/implementation-writer/AGENT.md` (modify)

**Description:**
After the implementation plan is fully written and saved (Step 6 of the Process section in AGENT.md), add a new step: "Check for needed code writer types." The implementation-writer checks whether any step in the plan requires a code writer type that does not exist in the current roster (typescript-writer, hono-writer, ui-writer, trainer-writer). If a needed type is absent, append an entry to `docs/user_notes.md`.

Same rules as the debate-moderator annotation (Step 2): ABSENT/EMPTY → create file with header `# User Notes — Agent Requests`; append-only; entries are user-curated; normalize names to lowercase; convention not invariant.

Entry format:
```
- requested_by: implementation-writer
  expert_needed: <lowercase-normalized writer name>
  rationale: <why this code writer type is needed for this plan>
  source_session: <implementation plan filename>
```

This step must never block or delay plan delivery. It is the very last step of the AGENT.md Process section.

**Dependencies:** None (can proceed in parallel with Steps 1–3)

**Test (write first):**
Write Vitest tests covering:
1. **Post-hoc annotation step exists** — assert AGENT.md contains a step or section describing user_notes.md annotation after plan writing.
2. **Annotation is last step** — assert the user_notes step description references it occurring after the plan is written/saved (not before).
3. **Standard header documented** — assert AGENT.md contains the exact header `# User Notes — Agent Requests`.
4. **ABSENT/EMPTY guard described** — assert AGENT.md describes handling of both ABSENT and EMPTY file states.
5. **Convention language** — assert AGENT.md contains "entries are user-curated" (not "only the user may delete").
6. **Code-writer-only scope** — assert AGENT.md specifies the annotation is for missing code writer types only (not test writers, not experts).

**TLA+ Coverage:**
- States: `ABSENT`, `EMPTY`, `HAS_ENTRIES` (Machine 1)
- Transitions: `AppendEntry`
- Invariants: `NotesStateConsistency`, `AppendAlwaysEnabled`

---

### Step 5: Create `design-pipeline.puml` at Repo Root

**Files:**
- `design-pipeline.puml` (create, repo root)

**Description:**
Create a static PlantUML state diagram at the repository root that reflects the current six-stage pipeline structure defined in `.claude/skills/design-pipeline/SKILL.md`. The diagram must:
- Use `@startuml` / `@enduml` delimiters.
- Represent the pipeline as a state machine with states: `STAGE_1_QUESTIONER`, `STAGE_2_DESIGN_DEBATE`, `STAGE_3_TLA_WRITER`, `STAGE_4_TLA_REVIEW`, `STAGE_5_IMPLEMENTATION`, `STAGE_6_CONFIRMATION_GATE`, `STAGE_6_TIER_EXECUTING`, `STAGE_6_TIER_MERGING`, `STAGE_6_INTER_TIER_VERIFICATION`, `STAGE_6_GLOBAL_REVIEW`, `STAGE_6_FIX_SESSION`, `COMPLETE`, `HALTED`.
- Show the valid transitions between states as defined in the design-pipeline SKILL.md (including revision loops back to earlier stages).
- Include a note or title block: `Pipeline structure as of: 2026-04-01`.
- Be valid PlantUML syntax (parseable by the PlantUML plugin without errors).

This file is static. It is not generated on demand. It is updated in-place by the design-pipeline orchestrator at pipeline completion only when `changeFlag = TRUE` (see Step 6).

**Dependencies:** None

**Test (write first):**
Write a Vitest test that reads `design-pipeline.puml` as a string and asserts:
1. The file starts with `@startuml`.
2. The file ends with `@enduml`.
3. The file contains all 13 state names from the pipeline state machine (each of the states listed above appears at least once as a string).
4. The file contains at least one `-->` transition arrow.
5. The file contains the string `COMPLETE`.
6. The file contains the string `HALTED`.

**TLA+ Coverage:**
- State: `IDLE` → `PENDING` → `WRITING` → `COMPLETE`/`FAILED` (Machine 3 — this file is the `.puml` artifact whose lifecycle is modelled)
- Transition: `BeginAtomicWrite`, `RenameSucceeds` (creating the initial file is the first write; subsequent updates follow the atomic-write protocol from Step 6)
- Invariant: `AtomicWriteGuarantee` (the initial creation is a clean write; no pre-existing file to corrupt)

---

### Step 6: Update `design-pipeline/SKILL.md` — Add `changeFlag` and Atomic `.puml` Update Instruction

**Files:**
- `.claude/skills/design-pipeline/SKILL.md` (modify)

**Description:**
Add two additions to the design-pipeline SKILL.md:

**Addition 1 — `changeFlag` mechanism:**
In the State Machine section (or near the Stage 6 wrap-up description), define the `changeFlag` variable. `changeFlag` is a boolean that starts `FALSE` at pipeline start. Any stage that modifies pipeline structure (e.g., adds a new expert, changes a stage's role) sets `changeFlag = TRUE`. The flag is checked at Stage 6 wrap-up. Add a comment matching the TLA+ spec: "At most one structural change is captured per write cycle. Subsequent structural changes during PENDING/WRITING/COMPLETE/FAILED are silently dropped. This is an explicit design simplification."

**Addition 2 — `.puml` update at pipeline completion:**
In the Stage 6 section (Global Review / COMPLETE state), add an instruction: "At pipeline completion, if `changeFlag = TRUE`, update `design-pipeline.puml` using an atomic write: (1) write the updated diagram to a temp file (e.g., `design-pipeline.puml.tmp`); (2) rename the temp file to `design-pipeline.puml`. If the rename fails, the original `.puml` remains unchanged. If `changeFlag = FALSE`, skip the update entirely — do not create spurious diffs."

Also add a definition of "pipeline structure change" — the conditions that set `changeFlag = TRUE`: new expert added to roster, stage role changed, new stage added or removed, stage ordering changed.

**Dependencies:** Step 5 (the `.puml` file must exist before the update instruction is meaningful)

**Test (write first):**
Write Vitest tests covering:
1. **`changeFlag` described** — assert SKILL.md contains the string `changeFlag`.
2. **Atomic write instruction present** — assert SKILL.md contains text describing temp file write followed by rename.
3. **At-most-one-change note present** — assert SKILL.md contains "at most one structural change" (or equivalent — case-insensitive).
4. **No-change skip rule present** — assert SKILL.md contains a rule that skips the update when `changeFlag = FALSE`.
5. **Definition of "pipeline changed" present** — assert SKILL.md contains at least two of these terms: "new expert", "stage role", "new stage", "stage ordering" (defining what counts as a structural change).
6. **Atomic write safety guarantee** — assert SKILL.md states that the original `.puml` remains unchanged if the rename fails.

**TLA+ Coverage:**
- States: `IDLE`, `PENDING`, `WRITING`, `COMPLETE`, `FAILED` (Machine 3)
- Transitions: `PipelineStageModifiesStructure`, `PipelineCompletes_ChangeFlagSet`, `PipelineCompletes_NoChange`, `BeginAtomicWrite`, `RenameSucceeds`, `RenameFails`, `PumlResetAfterComplete`, `PumlResetAfterFailure`
- Invariants: `AtomicWriteGuarantee`, `TempBeforeRename`, `UpdateOnlyWhenChanged`, `TempFileOnlyDuringWrite`
- Liveness: `EventuallyUpdated`, `EventuallyIdle_Puml`

---

## State Coverage Audit

### Verification

**Machine 1 — UserNotesFile:**
- `ABSENT` — covered by Steps 2, 4 (annotation logic describes handling this state; tests assert ABSENT guard)
- `EMPTY` — covered by Steps 2, 4 (Amendment A3: EMPTY treated same as ABSENT; tests assert EMPTY guard)
- `HAS_ENTRIES` — covered by Steps 2, 4 (AppendEntry always transitions to HAS_ENTRIES; NotesStateConsistency tested)
- `AppendEntry` — covered by Steps 2, 4
- `UserDeleteEntries` — covered by Step 2 (documented as user convention in debate-moderator SKILL.md) and Step 4 (documented in AGENT.md)
- `NotesStateConsistency` — covered by Steps 2, 4 (test assertions on HAS_ENTRIES iff non-empty)
- `AppendAlwaysEnabled` — covered by Steps 2, 4 (no file state blocks append; tests verify ABSENT/EMPTY/HAS_ENTRIES all append successfully)

**Machine 2 — AutonomousExpertSelection:**
- `IDLE` — covered by Steps 2, 3 (debate-moderator starts IDLE; questioner no longer pre-populates selection)
- `SELECTING` — covered by Step 2 (ReceiveTopic triggers selection)
- `SELECTED` — covered by Step 2 (SelectionSucceeds guard and behavior documented)
- `FAILED` — covered by Step 2 (SelectionFails on empty result; hard precondition error)
- `ReceiveTopic` — covered by Step 2
- `SelectionSucceeds` — covered by Steps 1, 2 (expert-lodash in roster enables non-empty return)
- `SelectionFails` — covered by Step 2 (hard failure documented and tested)
- `DebateComplete` — covered by Step 2 (debate session ends, returns to IDLE)
- `AcknowledgeFailure` — covered by Step 2 (FAILED → IDLE transition)
- `SelectionNonEmpty` — covered by Step 2 (test: SELECTED requires non-empty set)
- `FailedOnlyWhenNoMatch` — covered by Step 2 (test: FAILED only when empty result)
- `SelectedExpertsOnlyWhenSelected` — covered by Step 2 (test: non-empty set only in SELECTED state)
- `EventuallyResolved` — covered by Step 2 (liveness: SELECTING eventually reaches SELECTED or FAILED)
- `EventuallyIdle_Selection` — covered by Step 2 (liveness: after SELECTED, returns to IDLE)

**Machine 3 — PumlUpdate:**
- `IDLE` — covered by Steps 5, 6
- `PENDING` — covered by Step 6 (changeFlag=TRUE triggers PENDING)
- `WRITING` — covered by Step 6 (BeginAtomicWrite moves to WRITING, writes temp)
- `COMPLETE` — covered by Steps 5, 6 (RenameSucceeds → COMPLETE)
- `FAILED` — covered by Step 6 (RenameFails → FAILED; original intact)
- All Machine 3 transitions — covered by Steps 5, 6
- All Machine 3 invariants — covered by Step 6 tests
- `EventuallyUpdated` — covered by Step 6 (PENDING eventually reaches COMPLETE or FAILED)
- `EventuallyIdle_Puml` — covered by Step 6 (COMPLETE/FAILED reset to IDLE)

All TLA+ states, transitions, and properties are covered by the implementation plan.

---

## Execution Tiers

### Tier 1: Independent Foundation (no inter-step dependencies)

Steps 1, 3, 4, and 5 have no dependencies on each other. They touch disjoint files and can be executed in parallel. Step 1 creates a new file; Steps 3 and 4 modify different existing files; Step 5 creates a new file at repo root.

Note: Windows MaxConcurrent cap is 3. Steps 1, 3, 4 can run in one batch (3 parallel); Step 5 runs in the next batch or as a fourth task if the cap is lifted.

| Task ID | Step | Title |
|---------|------|-------|
| T1 | Step 1 | Create `expert-lodash/SKILL.md` |
| T2 | Step 3 | Update `questioner/SKILL.md` — Remove Branch 11 |
| T3 | Step 4 | Update `implementation-writer/AGENT.md` — Post-Hoc Annotation |
| T4 | Step 5 | Create `design-pipeline.puml` at Repo Root |

### Tier 2: Dependent on Tier 1 (depends on T1 and T4)

Step 2 depends on Step 1 (expert-lodash must exist to be added to roster) and can reference Step 4 context. Step 6 depends on Step 5 (`.puml` file must exist for update instruction to be meaningful).

| Task ID | Step | Title |
|---------|------|-------|
| T5 | Step 2 | Update `debate-moderator/SKILL.md` — Autonomous Selection + Annotation |
| T6 | Step 6 | Update `design-pipeline/SKILL.md` — `changeFlag` + Atomic `.puml` Update |

---

## Task Assignment Table

| Task ID | Title | Tier | Code Writer | Test Writer | Dependencies | Rationale |
|---------|-------|------|-------------|-------------|--------------|-----------|
| T1 | Create `expert-lodash/SKILL.md` | 1 | trainer-writer | vitest-writer | None | Markdown skill file in `.claude/` directory; vitest-writer validates structural headings and frontmatter |
| T2 | Update `questioner/SKILL.md` — Remove Branch 11 | 1 | trainer-writer | vitest-writer | None | Modification to an existing `.claude/` skill file; vitest-writer validates section presence/absence assertions |
| T3 | Update `implementation-writer/AGENT.md` — Post-Hoc Annotation | 1 | trainer-writer | vitest-writer | None | Modification to an existing `.claude/` agent file; vitest-writer validates new annotation step and convention language |
| T4 | Create `design-pipeline.puml` | 1 | trainer-writer | vitest-writer | None | Static PlantUML file at repo root; trainer-writer authors the diagram content; vitest-writer validates syntax markers and state name presence |
| T5 | Update `debate-moderator/SKILL.md` — Autonomous Selection + Annotation | 2 | trainer-writer | vitest-writer | T1 | Modification to `.claude/` skill file; requires expert-lodash to exist (T1) for roster addition; vitest-writer validates roster, selection logic, and annotation rules |
| T6 | Update `design-pipeline/SKILL.md` — `changeFlag` + Atomic `.puml` Update | 2 | trainer-writer | vitest-writer | T4 | Modification to `.claude/` skill file; references `.puml` file location (T4 must exist); vitest-writer validates changeFlag description and atomic write instruction |
