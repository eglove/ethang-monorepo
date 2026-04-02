# Debate Session — Pipeline Improvements Design

**Date:** 2026-04-01
**Topic:** Pipeline improvements — autonomous expert selection, user_notes.md signaling, expert-lodash creation, and design-pipeline.puml diagram
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases
**Rounds:** 3
**Result:** CONSENSUS REACHED

---

## Debate Synthesis — pipeline-improvements-design

**Result:** CONSENSUS REACHED
**Rounds:** 3
**Experts:** expert-tdd, expert-ddd, expert-tla, expert-edge-cases

---

### Agreed Recommendation

The design is structurally sound and the four proposed features are in scope. However, six gaps must be resolved before implementation begins:

1. **Autonomous expert selection must be a named pure function** — not logic embedded in the moderator's orchestration flow. The function must have an explicit contract (inputs → expert subset) so tests can be written before implementation. If zero experts match, the function must fail with a hard precondition error, not silently proceed.

2. **`user_notes.md` append must be idempotent** — allow duplicate entries at write time and deduplicate at read time. This eliminates the TOCTOU race on check-before-write and the concurrent-write corruption risk. Case-normalize expert names before any comparison.

3. **Empty `user_notes.md` (zero bytes) must be handled as a distinct state** from the absent-file state. The guard that creates the file with a standard header must also apply when the file exists but is empty.

4. **The "only the user may delete entries" rule is a convention, not a system invariant.** It must be documented as such in the relevant SKILL.md/AGENT.md files. It cannot be enforced technically by a plain writable file, and stating it as a system guarantee is misleading.

5. **The `.puml` update trigger must use an explicit change-flag** — a boolean or event set by earlier pipeline stages when they modify pipeline structure — not an inference from accumulated context at Stage 6. "Pipeline changed" must be defined: what counts as a structural change (new agent added, stage reassigned, etc.).

6. **The `.puml` write must be atomic** — write to a temp file, then rename. This prevents a partially-written file from producing a broken diagram. The original file must remain unchanged if the write fails.

The `expert-lodash/SKILL.md` creation and the removal of questioner branch 11 are straightforward and uncontested. The questioner's remaining responsibilities should be explicitly named after the branch 11 removal so the agent's domain model is not left implicit.

---

### Expert Final Positions

**expert-tdd**
Position: The design is broadly sound but has testability gaps that must be addressed before implementation begins.
Key reasoning: Autonomous expert selection has no testable contract — the mapping rule must be extracted into a named pure function before a failing test can be written. The error states for `user_notes.md` are listed without test descriptions; specifically, the absent-file and empty-file paths need separate tests. The `.puml` update trigger ("pipeline changed") has no definition, so no test oracle can be constructed for it. All three issues are resolved by the agreed recommendations above.
Endorsed: expert-ddd (selection rule as named pure function), expert-edge-cases (empty file as distinct missing test case), expert-tla (TOCTOU atomicity framing), expert-edge-cases (atomic `.puml` write pattern), expert-tla (idempotent-append as TOCTOU resolution)

**expert-ddd**
Position: The design conflates infrastructure signaling with domain concepts and uses names that obscure intent. Structurally sound but requires model clarification.
Key reasoning: `user_notes.md` is a domain event log (roster gap log) named as a scratchpad. "Autonomous expert selection" is domain logic — a rule mapping topic properties to expert domains — embedded in an orchestrator. Both should be named and positioned correctly: the file should be named to reflect its role, and the selection rule should be a named domain service. The "only the user may delete entries" invariant is unenforceable as a technical constraint; it must be downgraded to a documented convention. Removing questioner branch 11 without naming the questioner's replacement responsibilities leaves the agent's domain model incomplete.
Endorsed: expert-tdd (selection rule as pure function), expert-tla (four-state model for `user_notes.md`), expert-tla (idempotent-append), expert-edge-cases (empty roster as hard precondition failure), expert-tdd (unenforced invariant as convention not guarantee)

**expert-tla**
Position: The state space contains multiple unmodeled states. The design is incomplete at the time of Round 1; resolvable by Round 3.
Key reasoning: `user_notes.md` has four states (absent, present-clean, present-with-entries, corrupt), not the two error states the briefing models. Autonomous selection has a `selected_empty` unguarded state. Check-before-write is a non-atomic TOCTOU transition. The `.puml` update has a liveness gap: Stage 6 cannot reliably infer what changed in earlier stages without an explicit change-flag. Resolved by: idempotent-append (eliminates TOCTOU and corrupt state), atomic `.puml` write (eliminates corrupt terminal state), hard precondition for empty selection, explicit change-flag for `.puml` trigger.
Endorsed: expert-edge-cases (TOCTOU as sequence violation — endorsed from atomicity angle), expert-ddd (unenforced delete invariant), expert-tdd (atomic `.puml` write), expert-ddd (idempotent-append as simpler resolution), expert-edge-cases (empty roster as precondition failure)

**expert-edge-cases**
Position: The design has multiple unhandled boundary conditions. Three of the four stated error states are happy-path-only specifications.
Key reasoning: Empty `user_notes.md` (zero bytes) is distinct from absent; case-insensitive expert name mismatches defeat check-before-write silently; partially-written `.puml` produces a misleading diagram; concurrent appends corrupt both entries; empty roster produces undefined behavior. The last unresolved gap entering Round 3 — the definition of "pipeline changed" for the `.puml` trigger — remains the design's sharpest open question. All other cases have agreed resolutions.
Endorsed: expert-tla (atomicity of check-before-write is the correct framing), expert-ddd (unenforced delete invariant), expert-tdd (resolution patterns all have clear test-first forms), expert-tla (change-flag as explicit boolean not inference)

---

## Round Transcripts

### Round 1

#### expert-tdd — Round 1

Position: The design is broadly sound but has testability gaps that must be addressed before implementation begins.

Reasoning:
The autonomous expert selection feature has no test anchor. The briefing says the debate-moderator "maps the incoming topic to the fixed 8-expert roster" — but what does "maps" mean in testable terms? Is it keyword matching? Embedding similarity? A deterministic rule? Without a failing test that describes the expected mapping behavior, the implementation can do anything and the suite will pass. This is the primary red flag: autonomy without a spec is not a feature, it is a guess.

The `user_notes.md` signaling mechanism is append-only and post-hoc, which is good for testability. However, "check the current roster before writing a request" is a side-effectful precondition — it reads the file system or in-memory state, then conditionally writes. Any test for this must be able to inject the current roster state so the check-before-write path is testable in isolation. If the implementation hard-codes a roster lookup from disk, unit testing becomes an integration test.

The `expert-lodash/SKILL.md` creation is a documentation artifact, not code. No test is required. The `.puml` diagram update at Stage 6 completion is also documentation, but it has a conditional trigger ("only if the pipeline changed"). That conditional should be tested: what happens when it fires unnecessarily? What happens when it does not fire when it should?

The error states (missing `user_notes.md`, append conflict, request for existing agent) are listed but have no test descriptions. "Agent creates the file with a standard header" — test that the header is the correct header, not just that the file exists. "Always append to end of file; never overwrite existing entries" — test that with a pre-populated file containing known content.

Objections:
- "Autonomous expert selection" has no testable contract. What inputs map to what experts, and what is the test that would fail if the mapping were wrong?
- The check-before-write pattern for `user_notes.md` requires dependency-injectable roster state, or it cannot be unit tested.
- Error state 1 ("agent creates the file") needs a test that verifies the exact header, not just file existence.
- The `.puml` update trigger condition ("pipeline changed") has no definition of "changed" — the test cannot be written without one.

Endorsements: None — round 1.

---

#### expert-ddd — Round 1

Position: The design conflates infrastructure signaling with domain concepts and uses generic naming that obscures intent. Structurally sound, but the domain model is anemic.

Reasoning:
The `user_notes.md` mechanism is, at its core, a domain event log — agents emit events about gaps in the expert roster, and the user is the consumer of those events. Naming it "user_notes.md" obscures this. The name suggests a scratchpad for human notes, not a structured event stream. A more honest name would be `agent-requests.md` or `roster-gap-log.md`. The four fields (`requested_by`, `expert_needed`, `rationale`, `source_session`) are a proto-event with no domain identity and no aggregate protecting its invariants.

The "autonomous expert selection" feature sits in the debate-moderator, which the briefing treats as an orchestrator (pure infrastructure). But the mapping of "topic → expert roster subset" is domain logic — it embeds a rule about which domain is relevant to which kind of topic. This rule should live in a named, testable domain concept, not buried inside the moderator's orchestration loop. Calling it "autonomous selection" names the mechanism, not the domain concept. A better name: `ExpertCouncilSelector` or `RosterCurator`.

The briefing's scope section lists "Remove branch 11 from questioner/SKILL.md" without describing what the questioner's new responsibilities are after that removal. Removing behavior from an orchestrator without naming the replacement model is an anemic refactor — the questioner becomes a diminished agent with no clear domain purpose.

The `.puml` diagram is pure infrastructure documentation and has no domain significance. Updating it "when the pipeline changed" is fine, but "pipeline changed" is not a domain event — it is a structural observation. This is acceptable as infrastructure-level behavior.

Objections:
- `user_notes.md` should be named to reflect its domain role (event log / roster gap log), not its human-facing appearance. The current name misleads.
- "Autonomous expert selection" is domain logic masquerading as infrastructure. The selection rule should be a named, testable, pure function — not baked into the moderator's orchestration flow.
- Removing branch 11 from questioner/SKILL.md without replacing it with a named responsibility leaves the questioner with an implicit, undescribed domain model.

Endorsements: None — round 1.

---

#### expert-tla — Round 1

Position: The state space for `user_notes.md` append and the autonomous-selection flow contains at least three unmodeled states. The design is incomplete.

State Model:
For `user_notes.md` signaling:
  States: { file_absent, file_present_clean, file_present_with_entries, file_corrupt }
  Transitions:
    file_absent → file_present_clean  [agent creates file with header]
    file_present_clean → file_present_with_entries  [agent appends valid entry]
    file_present_with_entries → file_present_with_entries  [agent appends additional entry]
    file_present_with_entries → file_corrupt  [concurrent write corrupts file] — UNGUARDED
    file_corrupt → ?  — UNMODELED, no recovery path

For autonomous expert selection:
  States: { unselected, selecting, selected_valid, selected_empty, selection_failed }
  Transitions:
    unselected → selecting  [topic + roster provided]
    selecting → selected_valid  [at least 1 expert matched]
    selecting → selected_empty  [no expert matched topic] — UNMODELED
    selecting → selection_failed  [roster is unavailable] — UNMODELED

Safety Properties (must always hold):
- user_notes.md never loses existing entries (append-only)
- Requests for existing agents are never written (check-before-write)
- Debate never proceeds with zero selected experts

Liveness Properties (must eventually happen):
- Every agent that detects a missing expert eventually writes a request
- Every .puml update eventually completes when pipeline changes

Reasoning:
The most serious gap is the `file_corrupt` state for `user_notes.md`. The briefing says "always append to end of file; never overwrite existing entries" — but two agents appending simultaneously can produce interleaved writes that corrupt both entries. This state is unmodeled and has no recovery path. In a monorepo where multiple pipeline stages may run concurrently, this is not a theoretical concern.

The `selected_empty` state for autonomous expert selection is equally serious. The briefing says "roster is a maximum, not a minimum" and confirms fewer-than-8 is valid. But it does not address zero-match. If zero experts are selected, does the debate error? Silently skip? Return a vacuous synthesis? This transition is unguarded and reaches an invalid state.

The `.puml` update trigger has a liveness problem: "only when the pipeline itself changed during that run" depends on accumulated context from the entire pipeline run. If Stage 6 does not have reliable access to what changed in stages 1–5, the trigger will silently misfire in either direction (unnecessary update or missed update).

Objections:
- `file_corrupt` state for concurrent appends is unmodeled and unrecoverable.
- `selected_empty` state (zero experts matched) is unguarded — the design assumes at least one expert always matches.
- `selection_failed` (roster unavailable at selection time) is unmodeled.
- The `.puml` trigger "pipeline changed" has a liveness gap: Stage 6 may not reliably know what changed in earlier stages without an explicit change-flag mechanism.

Endorsements: None — round 1.

---

#### expert-edge-cases — Round 1

Position: The design has multiple unhandled boundary conditions. Three of the four error states described are happy-path-only specifications.

Edge Cases Found:

| Category | Input / Condition | Current Handling | Consequence if Unhandled |
|---|---|---|---|
| Partial failure | `user_notes.md` header written, then append crashes | Unhandled | File has header only; next read may treat it as empty or corrupt |
| Concurrency | Two agents append simultaneously to `user_notes.md` | Unhandled | Interleaved writes corrupt both entries |
| Boundary | `user_notes.md` exists but is empty (zero bytes) | Unhandled | Agent may create a second header, producing a malformed file |
| Boundary | `user_notes.md` exists but has no header (manually edited) | Unhandled | Unclear whether agent prepends header or appends only |
| Sequence | Agent checks roster, finds expert missing; roster updated before append completes | Unhandled | A request for a now-existing expert is written |
| Scale | `user_notes.md` grows to 10,000 lines over many sessions | Unhandled | File becomes unwieldy; agents do not surface size warnings |
| Sequence | `.puml` update fires at Stage 6 but pipeline crashed in Stage 4 | Unhandled | Diagram may partially reflect a broken pipeline state |
| Type boundary | `expert_needed` field contains same name as existing expert (case-insensitive mismatch) | Unhandled | Duplicate request written because check is case-sensitive |
| Boundary | Autonomous selection receives a topic that is empty string or whitespace | Unhandled | Selection enters undefined behavior; may return all experts or none |
| External | `design-pipeline.puml` is read-only (Windows file permissions, git lock) | Unhandled | Update silently fails or crashes Stage 6 |

Reasoning:
The most dangerous unhandled case is the empty `user_notes.md` file scenario. The briefing says "agent creates the file with a standard header if the file does not yet exist" — but it does not say what happens if the file exists with zero bytes. The empty-file state is not the same as the absent-file state, and conflating them produces a file with a doubled header on the second run.

The case-insensitive expert name mismatch is equally dangerous because it defeats the check-before-write invariant silently. If the roster contains `expert-lodash` and the agent checks for `Expert-Lodash`, the check passes and a duplicate request is written. The briefing does not specify case normalization.

The `.puml` update behavior after a partial pipeline failure is not specified. If Stage 3 crashes and Stage 6 is somehow triggered anyway, the diagram reflects a state the pipeline never fully reached.

Objections:
- Empty `user_notes.md` (zero bytes) is not handled by the "file does not exist" error state — distinct state that needs its own guard.
- Case normalization for expert names during check-before-write is not specified — allows duplicate requests.
- `.puml` update after a partial pipeline failure produces a misleading diagram.
- Concurrent appends are unhandled.
- Autonomous selection with empty/whitespace topic string is unguarded.

Endorsements: None — round 1.

---

### Round 2

#### expert-tdd — Round 2

Position: Maintained.

Reasoning:
expert-ddd's point that "autonomous expert selection is domain logic masquerading as infrastructure" directly sharpens the testability problem. If the selection rule is buried in the moderator's orchestration flow, it cannot be tested in isolation. The recommendation to extract it into a named pure function is the correct move from a TDD standpoint: a pure function with a clear signature is a function you can write a test for before you write the implementation.

expert-tla's `selected_empty` state and expert-edge-cases' empty-topic-string case converge on the same root: the selection contract is not specified precisely enough to write a test.

I endorse expert-ddd's naming objection for `user_notes.md` from a TDD angle: a file whose purpose is ambiguous from its name will have ambiguous tests.

I also endorse expert-edge-cases' empty-file observation. The test for "agent creates file with header when file does not exist" is straightforward. But there is no test currently named for "agent handles file that exists but is empty" — and without naming that case, the red phase of TDD will never demand the correct implementation.

Objections:
- No new objections. The selection rule must be expressed as a pure, testable function with an explicit oracle before implementation begins.

Endorsements:
- expert-ddd: extraction of selection rule into a named pure function — endorses; it is the minimum structural change that makes the feature testable.
- expert-edge-cases: empty `user_notes.md` (zero bytes) is a distinct missing test case — endorses; absent-file and empty-file paths need separate tests.

---

#### expert-ddd — Round 2

Position: Maintained. One new concern added.

Reasoning:
expert-tla's state model for `user_notes.md` names four states: file_absent, file_present_clean, file_present_with_entries, file_corrupt. This is the correct domain vocabulary for the file's lifecycle. The briefing's "error states" section only models two, which means the domain model is partial.

The new concern: the briefing states "only the user may delete entries" from `user_notes.md`. This is a domain invariant that is enforced by social convention, not by the system. A domain invariant that exists only in documentation is not a domain invariant — it is a wish. If the implementation is a plain file that any agent can write to, nothing prevents an agent from truncating it. This invariant is unrepresentable in the current design.

I endorse expert-tdd's point that the selection rule must be a named pure function. This is independently a DDD concern: the rule maps topic properties to domain experts, which is a domain service.

Objections:
- "Only the user may delete entries" is a domain invariant with no enforcement mechanism in the design. The invariant is stated but not representable.

Endorsements:
- expert-tdd: selection rule as a named pure function — endorses.
- expert-tla: state model for `user_notes.md` is the correct domain vocabulary — endorses.

---

#### expert-tla — Round 2

Position: Maintained. One new concern added.

Reasoning:
expert-ddd's observation about "only the user may delete entries" being an unenforceable invariant is precisely the kind of safety property TLA+ would formalize. In formal terms: always(entries once present remain present). This property cannot be verified by the implementation as described because the file is writable by any agent.

expert-edge-cases raised the TOCTOU race for the check-before-write pattern. In state-machine terms, this is a non-atomic transition: the check and the write are two separate steps with an unguarded gap between them. The roster could transition from {expert_absent} to {expert_present} between the check step and the write step, producing an invalid append. The check-before-write must be atomic, or the invariant cannot be guaranteed.

Objections:
- TOCTOU: check-before-write is non-atomic — the roster can change between check and write, violating the no-duplicate-requests invariant. This requires either atomic CAS semantics or an explicit acknowledgment that the invariant is best-effort.

Endorsements:
- expert-ddd: "only the user may delete entries" is an unenforceable invariant — endorses.
- expert-edge-cases: TOCTOU race on check-before-write (raised as sequence violation) — endorses from the atomicity angle.

---

#### expert-edge-cases — Round 2

Position: Maintained with additions.

Edge Cases Found (new in Round 2):

| Category | Input / Condition | Current Handling | Consequence if Unhandled |
|---|---|---|---|
| Invariant violation | Agent truncates/rewrites `user_notes.md` (no enforcement of user-only-delete rule) | Unhandled | All prior entries lost silently |
| Type boundary | `topic` is a very long string (e.g., 50,000 chars) passed to autonomous selection | Unhandled | Selection function may time out, return garbage, or crash |
| Partial failure | `.puml` write begins, process interrupted mid-write | Unhandled | File left in partially-written state — PlantUML renders broken diagram |
| Boundary | Expert roster is empty (zero experts registered) | Unhandled | Selection produces empty council; debate cannot begin |

Reasoning:
expert-tla's atomicity framing of the TOCTOU case is the right model. The check-before-write must be treated as a single atomic operation, or the no-duplicate-request invariant degrades from a guarantee to a heuristic. In a local filesystem context, this could be addressed with a file lock or by making the operation idempotent. Either choice must be made explicit.

The partially-written `.puml` file is the new case to emphasize. PlantUML will silently render broken diagrams if the file contains valid-looking but incomplete UML. The update should be atomic (write to temp file, rename) or at minimum should validate the output before overwriting the original.

Objections:
- No new objections beyond those in the table above.

Endorsements:
- expert-tla: TOCTOU / atomicity of check-before-write — endorses; the atomicity framing is more precise.
- expert-ddd: "only the user may delete" invariant is unenforceable — endorses.

---

### Round 3

#### expert-tdd — Round 3

Position: Maintained. No new objections. Resolution paths identified.

Reasoning:
The Round 2 convergence on three issues (unenforced delete invariant, TOCTOU atomicity, partial `.puml` write) all have clear TDD resolution paths:

1. Unenforced delete invariant: document as convention not guarantee. The test for this is unwritable, which is the correct signal that the invariant is aspirational.
2. TOCTOU atomicity: test that interleaves a roster update between check and write; if the implementation cannot pass, choose idempotency and test deduplication instead.
3. Partial `.puml` write: test that an interrupted write leaves the original file unchanged. This demands an atomic write pattern (temp-file rename), which is testable.

Objections: None new.

Endorsements:
- expert-tla: TOCTOU atomicity framing — endorses.
- expert-edge-cases: atomic `.puml` write (temp-file rename) — endorses.
- expert-ddd: "unenforced invariant should be documented as convention not guarantee" — endorses.

---

#### expert-ddd — Round 3

Position: Maintained. No new objections. Resolutions confirmed.

Reasoning:
expert-tdd's resolution for the unenforced delete invariant ("document as convention not guarantee") is the pragmatic DDD answer. If an invariant cannot be enforced by the aggregate, it should be documented as a business rule with no technical guard — which means it is a process rule, not a system invariant. The briefing should change "only the user may delete entries" to "entries are user-curated; no automatic deletion is performed by agents."

expert-tla's TOCTOU analysis maps cleanly to a DDD aggregate concern. The correct DDD resolution is either (a) make the operation idempotent and deduplicate on read, or (b) extract the write-with-check into a domain service that owns the atomicity concern. Option (a) is simpler and does not require a domain service.

Objections: None new.

Endorsements:
- expert-tdd: "unenforced invariant should be documented as convention not guarantee" — endorses.
- expert-tla: idempotent-append as preferred TOCTOU resolution — endorses.
- expert-edge-cases: empty roster is an invalid domain state requiring hard precondition failure — endorses.

---

#### expert-tla — Round 3

Position: Maintained. State model refined. One residual open question.

State Model (refined):
For user_notes.md append (idempotent resolution):
  file_absent → file_present_clean  [agent creates file with header]
  file_present_clean → file_present_with_entries  [agent appends]
  file_present_with_entries → file_present_with_entries  [agent appends; uniqueness enforced at read]
  No file_corrupt terminal state when idempotent-append is used.

For .puml update (atomic write):
  puml_stale → puml_updating → puml_current  [no puml_corrupt reachable with temp-file rename]

For autonomous selection:
  selected_empty → precondition_failure  [hard error, not silent]

Residual open question: The change-flag mechanism for the .puml trigger. Stage 6 needs an explicit boolean or event set by earlier stages, not an inference from accumulated context.

Objections:
- The change-flag mechanism for the `.puml` trigger is the last unresolved design gap. Stage 6 needs a reliable signal — not an inference from accumulated context.

Endorsements:
- expert-tdd: atomic `.puml` write pattern — endorses.
- expert-ddd: idempotent-append as preferred TOCTOU resolution — endorses.
- expert-edge-cases: empty roster as hard precondition failure — endorses.

---

#### expert-edge-cases — Round 3

Position: Maintained. Residual cases resolved except change-flag definition.

Resolved cases:
- Empty file: add explicit empty-file guard alongside absent-file guard.
- Case normalization: normalize expert names to lowercase before check-before-write.
- Partial .puml write: atomic write pattern (temp-file rename).
- Concurrent appends: idempotent-append (allow duplicates, deduplicate on read).
- Empty roster: hard precondition failure.
- Long topic string: truncate or validate at entry point before selection.

Remaining gap: Definition of "pipeline changed" for the .puml trigger — inference is fragile and untestable; must be an explicit change-flag set during the pipeline run.

Objections:
- The definition of "pipeline changed" for the `.puml` trigger is the last unresolved gap.

Endorsements:
- expert-tla: change-flag as explicit boolean/event, not inference — endorses.
- expert-tdd: resolution patterns all have clear test-first forms — endorses the overall resolution approach.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-01_pipeline-improvements-design.md
