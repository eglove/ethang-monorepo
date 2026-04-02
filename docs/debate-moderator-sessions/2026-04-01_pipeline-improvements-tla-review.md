# Debate Session — Pipeline Improvements TLA+ Review

**Date:** 2026-04-01
**Topic:** TLA+ specification review for pipeline-improvements-lodash-expert
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases
**Rounds:** 3
**Result:** CONSENSUS REACHED

---

## Debate Synthesis — pipeline-improvements-tla-review

**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases

---

### Agreed Recommendation

The `PipelineImprovements.tla` specification is structurally correct. All six design-consensus amendments (A1–A6) are addressed in the spec. The three state machines (UserNotesFile, AutonomousExpertSelection, PumlUpdate), their transitions, guards, and safety invariants are correctly defined. The liveness properties are well-formed and supported by the fairness assumptions in `LiveSpec`.

Eight issues require action before this spec should be used as an implementation guide. None require structural changes to the state machines or transitions — all are resolvable by replacing one tautological invariant, fixing one syntactic defect, adding a new partial operator for read-time deduplication (or an explicit out-of-scope note), and adding seven documented comments for implicit design decisions. In order of priority:

1. **Deduplication key / `ReadEntries` absence** — The spec verifies write correctness for Amendment A2 (idempotent append at write time) but cannot verify read-side correctness (deduplication at read time). The deduplication key — which combination of `(agent, expertNeeded, sourceSession)` fields constitutes a duplicate — is unspecified. Either add a `ReadEntries` operator modelling the dedup operation, or add an explicit out-of-scope note asserting the dedup key and deferring the read-side verification to implementation tests.

2. **`AppendAlwaysEnabled` is tautological** — `notesFileState \in FileStates` is guaranteed by `TypeOK` and provides no verification value. Replace with a meaningful `ENABLED` predicate: `\A a \in Agents, en \in Roster, s \in Sessions : Len(notesEntries) < MaxEntries => ENABLED AppendEntry(a, en, s)`. Or remove the invariant and document the append-is-always-possible intent as a comment.

3. **`EventuallyResolved` vestigial quantifier** — The formula `\A t \in Topics : selectionState = "SELECTING" ~> selectionState \in {"SELECTED", "FAILED"}` does not bind `t` in the body. The `\A t \in Topics` quantifier is vestigial. Rewrite as `selectionState = "SELECTING" ~> selectionState \in {"SELECTED", "FAILED"}`.

4. **At-most-one-change-per-cycle is an implicit design decision** — `PipelineStageModifiesStructure` is guarded by `pumlState = "IDLE" /\ ~changeFlag`. This means structural pipeline changes during active write cycles (PENDING/WRITING/COMPLETE/FAILED) are silently dropped. This is an intentional simplification but it is not documented. Add a comment: `NOTE: At most one structural change is captured per write cycle. Subsequent changes during PENDING/WRITING/COMPLETE/FAILED are silently dropped. This is an explicit design simplification — not a bug.`

5. **`Init` does not cover the EMPTY starting state** — `notesFileState = "EMPTY"` is only reachable via `UserDeleteEntries`, not from `Init`. An external-origin empty file (manually created, left over from a prior session) would not be covered by TLC model checking with the current `Init`. Add a `UserBringsEmptyFile` action or add `notesFileState = "EMPTY"` as an alternative initial condition in the `.cfg` file. Document the gap if neither is added.

6. **`EntryType` drops `rationale` without explicit module-header documentation** — The production schema has four fields; the spec's `EntryType` has three. The comment inside the type definition explains the omission but the module header's amendment compliance notes do not. Add a note to the Amendment A2 compliance comment: `NOTE: rationale field omitted from EntryType — it has no safety/liveness consequences in this model. Deduplication key: (agent, expertNeeded, sourceSession). Rationale is present in the production schema.`

7. **Three machines are intentionally independent — document it** — `selectionState` and `pumlState` have no cross-machine invariant. The pipeline can record a structural change while a debate is active; a debate can complete while a puml write is in progress. This independence is intentional for the current design scope but is not stated. Add a comment near the `Next` relation: `NOTE: The three machines are intentionally independent. No cross-machine invariant is currently required. If the design couples selection lifecycle to pipeline lifecycle, add an invariant here.`

8. **`DebateComplete` naming ambiguity** — The action fires whenever `selectionState = "SELECTED"`, regardless of whether the debate produced outputs or returned an empty result. The name implies successful completion. Rename to `DebateSessionEnds` or add a comment: `DebateComplete fires on any debate terminus (successful or not). It does not guard on debate quality or output count.`

---

### Expert Final Positions

**expert-tdd**
Position: The spec correctly addresses all six amendments at a structural level, but has two testability gaps and several undocumented design decisions that would impede test-first implementation.
Key reasoning: `AppendAlwaysEnabled` is tautological — it cannot fail and therefore provides no red-phase signal. `EventuallyResolved`'s vestigial quantifier is syntactically misleading. The deduplication key for Amendment A2's read-side is unspecified, making it impossible to write a failing test for "correct deduplication." The `DebateComplete` naming ambiguity affects test oracle construction. All issues are resolvable without structural spec changes.
Endorsed: expert-tla (cross-machine independence documentation), expert-ddd (EMPTY initial state gap as model-checking coverage issue), expert-edge-cases (deduplication key as blocking omission for test-first work), expert-ddd (DebateComplete naming clarification).

**expert-ddd**
Position: The spec models the domain correctly per the consensus. Two underspecification issues — `EntryType` dropping `rationale` and the missing deduplication key — leave the production data model incompletely anchored to the spec. One naming concern.
Key reasoning: `EntryType` drops `rationale` without a clear module-header note connecting the omission to the production schema. The deduplication key for Amendment A2's idempotency guarantee is not stated — this is the same category of underspecification. `DebateComplete` should be renamed to a neutral term (`DebateSessionEnds`) or annotated to clarify it fires on any debate terminus, not only successful ones. The three machines' intentional independence should be documented as a design decision.
Endorsed: expert-tla (cross-machine independence should be documented), expert-tdd (EMPTY initial state gap as model-checking coverage issue), expert-tdd (AppendAlwaysEnabled tautology), expert-edge-cases (deduplication key omission is the same category as rationale omission).

**expert-tla**
Position: The spec is well-formed and addresses all six amendments correctly. Four structural issues require action: tautological invariant, vestigial quantifier, undocumented at-most-one-change-per-cycle constraint, and absent `ReadEntries` operator for read-side verification.
Key reasoning: The at-most-one-change-per-cycle constraint is the most significant implicit design decision — it means the spec models a simpler pipeline than real production (which may have multiple concurrent stage modifications). `ReadEntries` absence means the spec cannot verify the liveness property "every roster gap eventually surfaces to users." This is the most consequential coverage gap: write-side correctness is verified, read-side correctness is not. All other issues are documentation-level fixes.
Endorsed: expert-edge-cases (deduplication key is a blocking omission for verifying Amendment A2's read side), expert-ddd (rationale and deduplication key are the same underspecification category), expert-tdd (all resolution items have clear test-first forms).

**expert-edge-cases**
Position: The spec handles most boundary conditions from the consensus correctly. The deduplication key omission is the most actionable new finding. All other issues have clear resolutions via spec comments.
Key reasoning: The silent change-flag drop during non-IDLE puml states needs documentation (at-most-one-change-per-cycle). `MaxEntries` is a model-checking bound and should carry a production-system behaviour note (archival/rotation). The EMPTY initial state gap is a real TLC coverage gap. The deduplication key for read-time deduplication is unspecified — two entries identical across all three `EntryType` fields are indistinguishable, and the spec does not say whether they collapse to one or remain as two. This affects the invariant "entries never disappear without a user action."
Endorsed: expert-tla (ReadEntries absence means Amendment A2's read-side cannot be verified), expert-tdd (all issues are resolvable), expert-ddd (cross-machine independence should be documented).

---

## Round Transcripts

### Round 1

#### expert-tdd — Round 1

Position: The spec correctly addresses all six amendments at a structural level, but has two testability gaps that require action before implementation: a vacuous safety invariant and an ambiguous liveness formulation.

Reasoning:
The most important amendment from a TDD standpoint is A1 — `selectExperts` must be a named pure function with an explicit contract. The spec delivers this correctly: `selectExperts(topic)` is a declared operator with two observable outputs, and the two transitions `SelectionSucceeds`/`SelectionFails` are guarded by that function's return value. A Vitest test can directly mirror this contract: given `TopicWithNoMatch`, `selectExperts` returns `{}` and the machine transitions to `FAILED`; given any other topic, it returns `Roster` and transitions to `SELECTED`. That is a testable, falsifiable spec.

Amendment A2 (idempotent append) is modelled correctly — `AppendEntry` always appends regardless of current state and there is no deduplication guard at write time. This is what the consensus prescribed. However, the spec does not model "deduplication at read time," which was also specified in the design consensus. Read-time deduplication is outside the TLA+ state space (it is an observer concern), but there is no comment noting this gap. A test must cover it, and the spec should acknowledge the omission.

The `AppendAlwaysEnabled` invariant is a tautology — `notesFileState \in FileStates` is trivially true by the `TypeOK` invariant. This contributes nothing to verification and provides false confidence. A meaningful formulation would assert that for all states in `FileStates`, `AppendEntry` is enabled: `\A a \in Agents, en \in Roster, s \in Sessions : Len(notesEntries) < MaxEntries => ENABLED AppendEntry(a, en, s)`. This is checkable.

Liveness property `EventuallyResolved` quantifies over `Topics` but the body of the formula does not use `t` — it is `selectionState = "SELECTING" ~> selectionState \in {"SELECTED", "FAILED"}`. The universal quantifier over `t` is vestigial and potentially misleading. The property says "whenever SELECTING, eventually resolve" — which is the correct intent, but the `\A t` wrapper adds noise without adding constraint.

Objections:
- `AppendAlwaysEnabled` is a tautology and provides no verification value. It should be replaced with a meaningful ENABLED check.
- `EventuallyResolved` has a vestigial `\A t \in Topics` quantifier that does not bind in the body — the property is correct in effect but misleading in form.
- The spec does not note that read-time deduplication (Amendment A2's other half) is out of scope — implementers reading the spec without the consensus document will miss it.

Endorsements: None — Round 1.

---

#### expert-ddd — Round 1

Position: The spec models the domain correctly per the consensus. One domain concept from the briefing is absent from the type model; the EMPTY state distinction deserves explicit documentation.

Reasoning:
The three state machines map cleanly onto the three domain concerns established in the consensus: file-as-event-log (Machine 1), topic-to-expert mapping as a named domain service (Machine 2), and diagram-update as an infrastructure side-effect with explicit triggering (Machine 3). The naming is honest — `selectExperts`, `AppendEntry`, `UserDeleteEntries`, `ReceiveTopic`, `DebateComplete` all use domain language from the problem space. The amendment compliance notes at the top of the module confirm each amendment is addressed.

Amendment A3 — EMPTY file treated same as ABSENT — is correctly modelled: `AppendEntry` transitions to `HAS_ENTRIES` from any state including `EMPTY`, and there is no guard that distinguishes the two for the header-creation concern. This is correct. However, the `UserDeleteEntries` action only fires when `notesFileState = "HAS_ENTRIES"`. The result is that the file can be reset to `ABSENT` or `EMPTY` — but the reverse transition (file going from `ABSENT` to `EMPTY` by external means, e.g., a user creating an empty file manually) is not modelled. In practice this means the spec models the file as starting `ABSENT` and only becoming `EMPTY` via a user delete-reset. If a file arrives `EMPTY` from an external source (not created by the pipeline), the spec's `Init` state does not cover it.

The `EntryType` record omits the `rationale` field from the design consensus schema. The spec comment explains this as a tractability simplification ("rationale is free text — we model it as a token from Sessions"), but this means the spec's type model does not match the actual entry schema. The field exists in the briefing as one of four named fields: `requested_by`, `expert_needed`, `rationale`, `source_session`. The spec maps `requested_by` → `agent`, `expert_needed` → `expertNeeded`, `source_session` → `sourceSession`, and drops `rationale` entirely. If `rationale` has no safety or liveness consequences (which the comment asserts), this is acceptable — but it should be documented more explicitly in the module header.

Objections:
- `Init` only initializes `notesFileState = "ABSENT"`. The EMPTY state is reachable from `HAS_ENTRIES` via `UserDeleteEntries`, but not from the initial state. If the file can arrive EMPTY from an external source, the spec misses that initial condition.
- `EntryType` drops the `rationale` field without a clear statement in the module header that this omission is intentional and safe.

Endorsements: None — Round 1.

---

#### expert-tla — Round 1

Position: The spec is well-formed and addresses all six amendments correctly. Four issues need attention: a tautological invariant, an unguarded cross-machine interaction, a missing intermediate safety property, and an IDLE guard gap in `PipelineStageModifiesStructure`.

State Model (abbreviated):
- Machine 1: ABSENT/EMPTY/HAS_ENTRIES with AppendEntry always succeeding; UserDeleteEntries resets to ABSENT or EMPTY.
- Machine 2: IDLE → SELECTING → SELECTED/FAILED → IDLE via ReceiveTopic, SelectionSucceeds/Fails, DebateComplete/AcknowledgeFailure.
- Machine 3: IDLE → PENDING → WRITING → COMPLETE/FAILED → IDLE with changeFlag and tempFileExists guards.

Reasoning:
The most serious spec gap is the absence of a cross-machine safety invariant. The three machines are modelled independently, but a coupling exists in the pipeline run lifecycle: `PipelineStageModifiesStructure` setting `changeFlag` could fire while `selectionState = "SELECTED"`. The spec does not assert whether this is valid or invalid. If the pipeline runs while a debate is active, the change flag fires and the puml write can begin concurrently with the debate. Is that intended? The consensus does not say, and the spec does not assert either way.

`PipelineStageModifiesStructure` is guarded by `pumlState = "IDLE" /\ ~changeFlag`. This means structural pipeline changes occurring while a write is in progress (PENDING/WRITING/COMPLETE/FAILED) are silently dropped — the action is disabled during non-IDLE puml states. The consensus specified "explicit change-flag set by pipeline stages" — but did not address what happens when a stage modifies structure while a write is already underway. The current spec drops that signal silently; this should be noted as a known simplification.

`TempBeforeRename` and `TempFileOnlyDuringWrite` together correctly model the atomic write invariant from both directions — Amendment A6 is verified.

Objections:
- `PipelineStageModifiesStructure` is guarded by `pumlState = "IDLE"`. Structural changes during a write cycle (PENDING/WRITING/COMPLETE/FAILED) are silently dropped. This should be documented as a design decision, not left as an implicit consequence of the guard.
- No cross-machine invariant asserts anything about the interaction of `selectionState` and `pumlState`. If the pipeline modifies structure while a debate is active, both machines run concurrently. Is this valid? The spec is silent.
- `AppendAlwaysEnabled` is tautological — confirmed.
- `EventuallyResolved`'s `\A t \in Topics` quantifier does not bind `t` in the body — syntactically vestigial.

Endorsements: None — Round 1.

---

#### expert-edge-cases — Round 1

Position: The spec handles most boundary conditions from the consensus correctly, but four edge conditions are either unmodelled or insufficiently specified.

Edge Cases Found:

| Category | Input / Condition | Current Handling | Consequence if Unhandled |
|---|---|---|---|
| Sequence | `changeFlag` set while `pumlState = "PENDING"` or `"WRITING"` | Unhandled — guard prevents it | Change silently dropped; structural change in pipeline not captured in next puml update |
| Sequence | `ReceiveTopic` called while `selectionState = "SELECTING"` | Blocked by guard (`selectionState = "IDLE"` required) | Correctly handled — no re-entrant selection |
| Boundary | `notesEntries` at exactly `MaxEntries` length | `AppendEntry` blocked by `Len(notesEntries) < MaxEntries` | Model-checking bound hits; spec does not assert what system should do at the real boundary |
| Partial failure | `RenameFails` transitions to `FAILED` and `tempFileExists = FALSE` | Handled — `originalPumlSafe` stays `TRUE` | Correctly modelled per A6 |
| Sequence | `UserDeleteEntries` fires while `selectionState = "SELECTING"` | Unblocked — both machines are independent | Notes file reset during active selection — valid per design but worth asserting |
| Concurrency | `PipelineStageModifiesStructure` fires multiple times before `PipelineCompletes_ChangeFlagSet` | Second fire blocked by `~changeFlag` guard | Idempotent — correct behaviour |
| Boundary | `Init` with `notesFileState = "ABSENT"` — no path to initial `EMPTY` state | `EMPTY` only reachable via `UserDeleteEntries` | External-origin empty file not modelled as starting state |
| Sequence | `AcknowledgeFailure` does not reset `currentTopic` | `currentTopic' = "NONE"` IS present in `AcknowledgeFailure` | Correctly handled |

Reasoning:
The most dangerous unmodelled case is the silent change-flag drop. The guard `pumlState = "IDLE"` means the action is disabled in PENDING/WRITING/COMPLETE/FAILED states. From the system's perspective, a structural pipeline change during an active write cycle will be silently ignored — the next write cycle will not include it. The consensus document said the change-flag must be explicit, but did not address this scenario. The spec silently resolves it by making the action impossible, which is a design decision that should be named.

The `MaxEntries` bound is a model-checking artifact, correctly noted in the spec. However, the spec does not assert what the real system should do when `Len(notesEntries)` reaches the production limit. A note that the production system should handle the unbounded case differently (rotation, archival) would prevent misuse of the spec as a production design document.

The EMPTY initial state gap (noted by expert-ddd) is a genuine edge: the spec cannot start with `notesFileState = "EMPTY"` unless the config is explicitly set that way. Since `Init` hardcodes `"ABSENT"`, external-origin empty files are not covered.

Objections:
- Silent change-flag drop when `PipelineStageModifiesStructure` fires during non-IDLE puml states should be explicitly documented as a design decision, not left as an implicit guard consequence.
- `MaxEntries` bound is not accompanied by a note about production-system behaviour at the real limit (archival, rotation, error).
- EMPTY state is not reachable from `Init` — only from `UserDeleteEntries`. External-origin empty files are not modelled.

Endorsements: None — Round 1.

---

### Round 2

#### expert-tdd — Round 2

Position: Maintained. Round 1 objections stand. Two convergences with other experts noted.

Reasoning:
expert-tla and expert-edge-cases both independently identified the silent change-flag drop as the spec's most consequential undocumented design decision. From a TDD angle, this is also untestable as written: if `PipelineStageModifiesStructure` is disabled during non-IDLE states, there is no action to test. A test that fires a structural change during `WRITING` state will find the action has no effect — but the spec does not say whether "no effect" is the intended behaviour or a gap. Without a comment or invariant asserting "structural changes during active write cycles are intentionally dropped," a test cannot distinguish correct behaviour from a missing feature.

expert-ddd's `Init` gap (no `EMPTY` starting state) is a real coverage hole. The spec can be fixed trivially by adding an alternative `Init` configuration or by adding a `UserBringsEmptyFile` action. Without it, TLC never exercises the `EMPTY → HAS_ENTRIES` transition path from a cold start. This is a model-checking coverage gap, not just a documentation issue.

Objections: None new. Existing three stand.

Endorsements:
- expert-tla: Cross-machine interaction between `selectionState` and `pumlState` during concurrent operation — endorses; if the pipeline modifies structure while a debate is running, the spec should assert the valid states explicitly.
- expert-ddd: `Init` not covering the `EMPTY` starting state is a model-checking coverage gap, not just a documentation issue — endorses.
- expert-edge-cases: `MaxEntries` bound should have a note about production behaviour — endorses from testability angle.

---

#### expert-ddd — Round 2

Position: Maintained. `EntryType` omission and `Init` gap remain. One new concern added.

Reasoning:
expert-tla's point about the absent cross-machine invariant is a domain concern as well. The two machines `AutonomousExpertSelection` and `PumlUpdate` both relate to the pipeline run lifecycle. In domain terms: an expert selection is an event within a pipeline session; a puml update marks the end of a pipeline session. These are not truly independent — a puml update finalizing a session while a selection is still `SELECTING` is at minimum an unusual state. The spec models them as fully independent, which may be correct for the current design scope, but a comment explaining that independence is a deliberate modelling choice would clarify intent.

New concern: `DebateComplete` resets `selectedExperts` to `{}`. This is correct. But the action has no guard on debate outcome. A debate that produces zero outputs from all experts would still transition through `SELECTED → IDLE` via `DebateComplete`. The action name implies successful completion. If it also fires on empty-result debates, the name is misleading.

Objections:
- `DebateComplete` should be named to reflect that it fires on any debate terminus (successful or not), or a comment should clarify that "complete" means "the session ended," not "the debate succeeded."

Endorsements:
- expert-tla: Cross-machine invariant gap — endorses.
- expert-tdd: `Init` gap as model-checking coverage issue — endorses.
- expert-tdd: `AppendAlwaysEnabled` tautology — endorses.

---

#### expert-tla — Round 2

Position: Maintained. Key structural issues confirmed by other experts. One refinement.

Reasoning:
The silent-drop of `PipelineStageModifiesStructure` during non-IDLE puml states is confirmed by expert-tdd and expert-edge-cases. The correct formal statement: the spec models at most one structural change per write cycle. If multiple structural changes occur in a single pipeline run, only the first is captured. This is a design constraint that should be stated as a comment in the spec: `NOTE: At most one change signal per write cycle. Subsequent structural changes during PENDING/WRITING/COMPLETE/FAILED are silently dropped. This is an explicit design simplification.`

While in non-IDLE puml states, `changeFlag = TRUE` is always enforced by existing invariants (`UpdateOnlyWhenChanged`). But a NEW structural change during a write cycle cannot be captured because `PipelineStageModifiesStructure` requires `~changeFlag`. The at-most-one-change-per-cycle constraint is implicit and needs to be named.

Objections:
- The at-most-one-change-per-cycle constraint is a significant implicit design decision. It should be made explicit via a comment in the spec and noted in the module header's amendment compliance section.
- Cross-machine invariant gap stands — no property asserts valid concurrent states of `selectionState` and `pumlState`.

Endorsements:
- expert-tdd: `AppendAlwaysEnabled` tautology confirmed — endorses.
- expert-ddd: `DebateComplete` naming concern — endorses from state-machine perspective.
- expert-edge-cases: EMPTY initial state gap is a real TLC coverage gap — endorses.

---

#### expert-edge-cases — Round 2

Position: Maintained. Convergence on three main issues. One additional boundary confirmed.

Reasoning:
The silent change-flag drop has been independently confirmed by expert-tla, expert-tdd, and myself. The consensus is clear: it needs documentation. The fix is a comment in the spec, not a structural change.

The `MaxEntries` bound issue: the comment says "This does not affect the safety/liveness properties being verified." This is technically accurate for TLC, but potentially misleading for implementers. The spec should add: `NOTE: In production, notesEntries is unbounded. The system must handle archival or rotation at a practical size limit. MaxEntries is a model-checking bound only.`

New boundary confirmed: `AppendEntry` can write the same `expertNeeded` value multiple times (by design — Amendment A2 allows duplicates). But `EntryType` does not include a `timestamp` or sequence number. Two identical entries from the same agent and session are indistinguishable. If deduplication at read time uses all fields as the key, two truly identical entries would collapse to one — which might be the intent, but the spec does not assert a deduplication key.

Objections:
- Deduplication key for read-time deduplication (Amendment A2's second half) is not specified. If two entries are identical across all `EntryType` fields (same agent, expert, session), the spec does not say whether they deduplicate to one or remain as two.
- `MaxEntries` production-behaviour note still missing.

Endorsements:
- expert-tla: At-most-one-change-per-cycle is an implicit design constraint that needs explicit documentation — endorses.
- expert-ddd: `DebateComplete` naming concern — endorses.
- expert-tdd: EMPTY initial state gap affects model-checking coverage — endorses.

---

### Round 3

#### expert-tdd — Round 3

Position: Maintained. Resolution paths for all Round 1 objections confirmed. Endorsing Round 2 convergence.

Reasoning:
The deduplication key issue (expert-edge-cases Round 2) is new and directly affects test-first work. If two entries are identical, the test for "deduplication at read time collapses them to one" cannot be written without knowing what "identical" means. If the key is all three fields (agent + expertNeeded + sourceSession), then two writes with the same values deduplicate correctly but intentional duplicates from a retry cannot be distinguished from accidental duplicates. The spec should state the deduplication key or explicitly defer it to implementation. This is a blocking omission for test-first work.

The `DebateComplete` naming concern (expert-ddd Round 2) is not a structural spec defect — the transition is correct. But naming it `DebateComplete` when it fires on any terminus (including zero-output debates) will mislead implementers writing tests. A test named `debateComplete_firesAfterAnyTopic` reads very differently from `debateComplete_firesOnlyOnSuccessfulDebate`. The spec should clarify the intent.

Objections: None new.

Endorsements:
- expert-edge-cases: Deduplication key for read-time dedup is unspecified — endorses as a blocking omission for test-first implementation.
- expert-ddd: `DebateComplete` naming ambiguity — endorses; it affects test naming and oracle construction.

---

#### expert-ddd — Round 3

Position: Maintained. All Round 1 and Round 2 concerns have resolution paths. No new objections.

Reasoning:
The deduplication key omission (expert-edge-cases Round 2) aligns with my concern about `EntryType` dropping `rationale`. Both are cases where the spec's type model underspecifies the production data model. Together they mean: the spec's `EntryType` has three fields, the production schema has four, and the deduplication key for one of the most important design decisions (Amendment A2 idempotency) is not stated. The fix is a comment in the spec asserting the deduplication key and noting that `rationale` is excluded from the model for tractability but present in the production schema.

`DebateComplete` naming: the action should either be renamed `DebateSessionEnds` (neutral) or guarded with a comment explaining that "complete" means "the session ended" not "the debate succeeded."

Objections: None new.

Endorsements:
- expert-edge-cases: Deduplication key omission — endorses; it is the same category of underspecification as the `rationale` field omission.
- expert-tdd: `DebateComplete` naming should be clarified — endorses.
- expert-tla: Cross-machine independence should be explicitly documented — endorses.

---

#### expert-tla — Round 3

Position: Maintained. All structural issues from Rounds 1–2 confirmed. No new objections. Resolution list proposed.

Reasoning:
The deduplication key issue (expert-edge-cases Round 2) is correctly identified. In TLA+ terms: the spec asserts `AppendEntry` is idempotent at the write level — it always appends. It does not model a deduplication operation at read time. The read-time operation is modelled as outside the spec scope (no `ReadEntries` action exists). This means the spec cannot verify the liveness property "every roster gap eventually gets addressed" because the mechanism for surfacing gaps to the user is unspecified. This is the most consequential omission: the spec verifies that entries are written, but cannot verify that the right entries are acted on.

If a `ReadEntries` operator were added returning the deduplicated set of `expertNeeded` values from `notesEntries`, a safety property could assert "ReadEntries never loses an entry that was written" and a liveness property could assert "every written expertNeeded eventually appears in ReadEntries." These are not currently verifiable.

The at-most-one-change-per-cycle constraint is the second most significant implicit decision. It means the spec models a simpler pipeline than real production (which may have multiple concurrent stage modifications).

Resolution summary (all confirmed, requiring spec changes):
1. Replace `AppendAlwaysEnabled` with a meaningful ENABLED predicate or a comment.
2. Fix `EventuallyResolved` to remove vestigial `\A t \in Topics`.
3. Add a note about read-time deduplication being out of scope, stating the deduplication key.
4. Add a comment: `EMPTY` is not an initial state; external-origin empty files require config or a `UserBringsEmptyFile` action.
5. Add module-header note about `rationale` field exclusion and deduplication key.
6. Add comment: `PipelineStageModifiesStructure` guard silently drops structural changes during non-IDLE puml states — at-most-one-change-per-cycle is a design simplification.
7. Add comment: Three machines are intentionally independent; no cross-machine invariant is currently required.
8. Clarify `DebateComplete` naming.

Objections: None new.

Endorsements:
- expert-edge-cases: Deduplication key is a blocking omission for verifying the core idempotency amendment — endorses strongly.
- expert-ddd: `rationale` field and deduplication key are the same underspecification category — endorses.
- expert-tdd: All resolution items have clear test-first forms — endorses.

---

#### expert-edge-cases — Round 3

Position: Maintained. Deduplication key is confirmed as the most actionable new finding. All other issues have clear resolutions. No new objections.

Reasoning:
expert-tla's observation that the spec cannot verify "every roster gap eventually gets addressed" because `ReadEntries` is unmodelled is the sharpest statement of why the deduplication key omission matters. The spec verifies write correctness (entries are appended) but not read correctness (deduplicated gaps surface to users). This is a structural gap in the spec's coverage of Amendment A2.

All other Round 1 and Round 2 objections have been confirmed as resolvable via spec comments, not structural changes. The spec's state machines, transitions, guards, and safety invariants are all correct. The issues are:
- One tautological invariant to replace
- One vestigial quantifier to fix
- Multiple missing comments documenting intentional design decisions
- One naming ambiguity to resolve
- One structural gap (deduplication key / `ReadEntries`) that requires either an addition to the spec or an explicit out-of-scope note

Objections: None new.

Endorsements:
- expert-tla: `ReadEntries` absence means Amendment A2's read-side cannot be verified — endorses; this is the most actionable gap.
- expert-tdd: All issues are resolvable — endorses the overall resolution approach.
- expert-ddd: Cross-machine independence should be documented — endorses.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-01_pipeline-improvements-tla-review.md
