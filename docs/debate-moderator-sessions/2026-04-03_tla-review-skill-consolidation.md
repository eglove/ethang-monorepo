# Debate Session — TLA+ Review: Skill Consolidation & CLAUDE.md Dissolution

**Date:** 2026-04-03
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tla, expert-edge-cases, expert-ddd, expert-tdd, expert-continuous-delivery

---

## Review Focus

Review the TLA+ specification `SkillConsolidation.tla` against the agreed design consensus and original briefing. Focus on whether the spec correctly captures all states, transitions, safety properties, and liveness properties.

---

## Agreed Recommendation

The TLA+ specification is structurally sound and captures the core dissolution workflow correctly. The preconditions on `DeleteClaudeMd` are comprehensive and enforce the mandatory gate pattern. However, the spec has **six issues** that must be addressed before implementation, ranging from a tautological safety property to missing states from the design consensus:

1. **S8 (SplitOrdering) is a tautology and must be rewritten.** The property `docBddSplitStatus = "complete" => docBddSplitStatus \in {"eval_to_expert", "complete"}` is trivially true because "complete" is in the set on the right-hand side. The intent was to verify that the system passed through `eval_to_expert` before reaching `complete`. This requires a history variable or a stronger formulation. Replace with a transition guard invariant: assert that the only action that can set the status to "complete" is the one whose precondition requires `eval_to_expert`. The transition guards in `CompleteDocBddSplit` and `CompleteTlaSplit` already enforce this operationally, so the invariant should be reformulated to state what it actually means to verify -- e.g., track whether `eval_to_expert` was visited.

2. **doc-bdd relocation to project scope is not modeled.** The design consensus explicitly says doc-bdd production content should become a separate project-scoped skill at `.claude/skills/doc-bdd/SKILL.md`. The spec models the split as `unsplit -> eval_to_expert -> complete` but does not capture the relocation step. Add a state or transition for the relocation, or document that relocation is considered an implementation detail outside the spec's scope.

3. **Checklist assignments are irrevocable.** `AssignDestination` guards on `checklist[section] = NULL`, preventing reassignment. If a section is assigned to the wrong destination, there is no corrective action. Add a `ReassignDestination` action that allows changing a destination before the checklist is verified (while `~checklistVerified`).

4. **NoContentLoss (S1) covers sections but not skill content.** The `AbsorbSkill` action transitions a skill from "pending" to "absorbed" without any precondition that verifies the skill's content actually landed in a destination file. A skill could be marked "absorbed" without its content being present anywhere. Consider adding a precondition to `AbsorbSkill` that requires the destination agent file to exist, or add a safety property that `absorbed` implies content presence.

5. **MigrateSection does not verify destination agent file exists.** If a section's checklist destination is an agent file (not SharedConventionsFile), there is no guard verifying that agent file exists or is writable. The guard `checklist[section] = SharedConventionsFile => sharedConvStatus = "created"` only covers the shared conventions case.

6. **Missing liveness: all user-scoped skills eventually absorbed.** The spec has `EventuallyAllMigrated`, `EventuallyDissolved`, `EventuallyMergeQueue`, and `EventuallySplitsComplete`, but no liveness property for skill absorption. Add `EventuallyAllAbsorbed == <>(\A sk \in UserScopedSkills : skillStatus[sk] = "absorbed")`.

---

## Expert Final Positions

**expert-tla**
Position: Approve with mandatory fixes. The spec correctly models the dissolution workflow as a state machine with well-guarded transitions. The `DeleteClaudeMd` preconditions are comprehensive -- they require checklistVerified, all sections migrated, shared conventions created and referenced by all agents, both splits complete, and all skills absorbed. This is the right set of guards. However, S8 (SplitOrdering) is formally vacuous and must be replaced. The transition guards in `CompleteDocBddSplit` and `CompleteTlaSplit` enforce ordering operationally, but the safety property as written does not verify this -- it is satisfied by any state. The fix is either to introduce a history variable tracking whether `eval_to_expert` was visited, or to reformulate as: in any state where the split status is "complete", the transition that produced it required "eval_to_expert" as a precondition. Since TLA+ safety properties are state predicates (not trace properties), the cleanest fix is to remove S8 and note that ordering is enforced by transition guards, which TLC verifies automatically during model checking.
Key reasoning: The spec's strength is in the `DeleteClaudeMd` action, which serves as the terminal gate. Every safety property (S1-S5) is an implication from `claudeMdDeleted`, and TLC will verify that no execution trace can reach `claudeMdDeleted = TRUE` without satisfying all preconditions. S6 and S7 are the non-trivial additions -- they enforce that checklist verification and shared conventions creation are prerequisites even for intermediate migration steps, not just for deletion. These are well-formulated.
Endorsed: expert-edge-cases (checklist irrevocability), expert-ddd (doc-bdd relocation gap)

**expert-edge-cases**
Position: Approve with mandatory fixes. Six edge cases identified:

Edge Cases Found:
- [irrevocability] Checklist assignment cannot be corrected once made. If a section is assigned to the wrong agent file, the only recovery is to restart the entire process (re-initialize all state). This is fragile. Add `ReassignDestination` with guard `~checklistVerified`.
- [phantom absorption] `AbsorbSkill` has no precondition verifying content was actually moved. A skill can be marked "absorbed" in an empty operation. The spec trusts the implementation to do the right thing, but the purpose of the spec is to not trust the implementation.
- [missing agent file guard] `MigrateSection` checks that shared conventions exists when the destination is SharedConventionsFile, but does not check that agent files exist when the destination is an agent file. This asymmetry means the spec permits migration to a nonexistent destination.
- [empty sets] If `ClaudeMdSections = {}` (empty), `VerifyChecklist` is trivially enabled (universal quantifier over empty set is TRUE), and `DeleteClaudeMd` is trivially enabled for its section-related preconditions. The spec should either constrain `ClaudeMdSections` to be non-empty or document this behavior.
- [empty UserScopedSkills] Similarly, if `UserScopedSkills = {}`, the skill absorption precondition on `DeleteClaudeMd` is trivially satisfied. This is actually correct per the design (merge queue CI is independent of skill absorption), but should be documented.
- [merge queue ordering] `UpdateMergeQueueCI` has no ordering constraint relative to other actions. It can happen before, during, or after dissolution. The design says merge queue is independent, so this is correct, but the spec should document this independence explicitly.

Key reasoning: The most serious issue is checklist irrevocability. In a real execution, humans make mistakes. The spec should model the ability to correct a mistake before locking it in. The phantom absorption issue is less critical because it is an implementation concern, but if the spec's purpose is to prevent content loss, then absorption should have a verifiable precondition.
Endorsed: expert-tla (S8 is vacuous), expert-tdd (missing liveness for skill absorption)

**expert-ddd**
Position: Approve with observations. The spec models the domain correctly at the workflow level -- dissolution is a lifecycle event with preconditions. Two domain-level observations:

1. The doc-bdd split pattern in the design consensus is richer than the spec captures. The consensus says: "doc-bdd becomes a separate project-scoped skill; only evaluation content goes to expert-bdd." The spec models this as a two-phase split (`unsplit -> eval_to_expert -> complete`), which captures the sequencing but not the relocation to project scope. The relocation (moving from `~/.claude/skills/doc-bdd/` to `.claude/skills/doc-bdd/SKILL.md`) is a distinct domain event that the spec elides.

2. The TLA+ split follows the same pattern correctly: evaluation to expert-tla, syntax/patterns to tla-writer. The spec captures this identically to doc-bdd, which is consistent.

3. The `SharedConventionsFile` is modeled as a singleton constant, which correctly represents the design's single shared conventions file. The `referencingAgents` set correctly models the requirement that all agent files must reference it.

Key reasoning: The spec's domain model aligns with the design consensus for the core workflow. The doc-bdd relocation gap is a modeling choice -- the spec author may have considered relocation an implementation detail. If so, this should be documented in the spec comments.
Endorsed: expert-tla (S8 fix), expert-edge-cases (checklist irrevocability)

**expert-tdd**
Position: Approve with one addition. The safety properties form a comprehensive test suite for the terminal state (`claudeMdDeleted = TRUE`). S1 through S5 each verify a specific precondition. S6 and S7 verify intermediate invariants. The liveness properties cover migration (L1), dissolution (L2), merge queue (L3), and splits (L4). But there is a gap: no liveness property for skill absorption. The design has four user-scoped skills that must be absorbed. If one is never absorbed, `DeleteClaudeMd` is blocked forever -- which is correct behavior -- but the spec should express the intent that absorption eventually happens. Add: `EventuallyAllAbsorbed == <>(\A sk \in UserScopedSkills : skillStatus[sk] = "absorbed")`.

Key reasoning: Liveness properties are the spec equivalent of "every test eventually passes." The absence of `EventuallyAllAbsorbed` means the spec does not express the intent that skill absorption completes. Without it, a model where one skill is never absorbed satisfies the spec's liveness properties (only L2 would fail, and L2 is sufficient to catch this -- but expressing the sub-goal explicitly makes the spec self-documenting).
Endorsed: expert-tla (S8 is vacuous and needs replacement), expert-edge-cases (phantom absorption)

**expert-continuous-delivery**
Position: Approve. The merge queue modeling is minimal and correct. `UpdateMergeQueueCI` transitions from "not_updated" to "updated" with no ordering constraints relative to the dissolution workflow. This matches the design: the `merge_group` trigger addition is independent of skill consolidation. The `Done` predicate requires both `claudeMdDeleted` and `mergeQueueStatus = "updated"`, which correctly captures that the full project is not complete until both work streams finish.

One observation: the spec does not model the CI validation step (running the merge queue CI to verify it works). The design says "existing checks remain required" but the spec treats CI update as atomic. This is acceptable for this level of abstraction -- CI validation is an implementation concern.

Key reasoning: The merge queue work stream is correctly modeled as orthogonal to dissolution. No ordering constraints, no shared state. This matches the design consensus where expert-continuous-delivery confirmed "the merge queue addition is trivial and low-risk."
Endorsed: expert-tla (spec is structurally sound), expert-edge-cases (merge queue independence should be documented)

---

## Round 1 Summary

All 5 experts approved the spec with fixes. New objections raised:

1. **expert-tla**: S8 (SplitOrdering) is a tautology (new objection)
2. **expert-edge-cases**: Checklist irrevocability, phantom absorption, missing agent file guard, empty set behavior (new objections)
3. **expert-ddd**: doc-bdd relocation not modeled (new objection)
4. **expert-tdd**: Missing liveness property for skill absorption (new objection)
5. **expert-continuous-delivery**: No objections, merge queue modeling is correct

Proceeding to Round 2 to verify no new objections arise.

---

## Round 2

Round 2 context provided to all experts: the six issues from Round 1.

**expert-tla (Round 2)**
Position: Agree with all Round 1 findings. On the S8 fix: the cleanest approach is to remove S8 entirely and add a comment noting that split ordering is enforced by the transition guards (`CompleteDocBddSplit` requires `docBddSplitStatus = "eval_to_expert"`, `CompleteTlaSplit` requires `tlaSplitStatus = "eval_to_expert"`). TLC verifies these guards during state exploration. Adding a history variable would increase the state space for no additional verification power.
Objections: None new.
Endorsements: expert-edge-cases (checklist irrevocability is the highest-priority fix), expert-tdd (missing liveness is easy to add)

**expert-edge-cases (Round 2)**
Position: Agree with all resolutions. On the phantom absorption question: expert-tdd's point about `EventuallyAllAbsorbed` is correct but does not address the underlying issue. The liveness property says absorption eventually happens, but the safety concern is that `AbsorbSkill` can fire without verifying content was moved. This is an implementation trust issue. In a TLA+ spec, you cannot verify file content -- you can only verify state transitions. So the practical fix is to add a comment on `AbsorbSkill` documenting that the implementation must verify content presence before calling this action. The spec is the right level of abstraction for this.
Objections: None new.
Endorsements: expert-tla (remove S8, rely on transition guards), expert-ddd (doc-bdd relocation documentation)

**expert-ddd (Round 2)**
Position: Agree. The doc-bdd relocation can be documented as an implementation detail in the spec comments rather than adding a new state. The spec's abstraction level is workflow state transitions, not file system operations.
Objections: None new.
Endorsements: expert-tla, expert-edge-cases

**expert-tdd (Round 2)**
Position: Agree. Adding `EventuallyAllAbsorbed` is the remaining action item for liveness completeness.
Objections: None new.
Endorsements: expert-edge-cases (phantom absorption is an implementation trust issue, not a spec issue)

**expert-continuous-delivery (Round 2)**
Position: No change. Agree with all resolutions.
Objections: None new.
Endorsements: All Round 1 positions.

---

## Round 2 Summary

No new objections raised. All Round 1 issues were resolved by consensus:

1. Remove S8 (SplitOrdering) and document that ordering is enforced by transition guards
2. Document doc-bdd relocation as an implementation detail in spec comments
3. Add `ReassignDestination` action with guard `~checklistVerified`
4. Add comment on `AbsorbSkill` documenting implementation must verify content presence
5. Add guard on `MigrateSection` for agent file destination existence (or document the asymmetry)
6. Add `EventuallyAllAbsorbed` liveness property

**Consensus reached after Round 2.**

---

## Endorsement Map

| Expert | Endorsed By |
|---|---|
| expert-tla (S8 is vacuous) | expert-edge-cases, expert-tdd, expert-ddd |
| expert-edge-cases (checklist irrevocability) | expert-tla, expert-ddd |
| expert-edge-cases (phantom absorption) | expert-tdd |
| expert-ddd (doc-bdd relocation gap) | expert-tla |
| expert-tdd (missing liveness for absorption) | expert-tla, expert-edge-cases |
| expert-continuous-delivery (merge queue correct) | expert-tla |

---

## Answers to Specific Review Questions

### 1. Does the spec correctly model the dissolution checklist as a mandatory gate before deletion?

**Yes.** `DeleteClaudeMd` requires `checklistVerified = TRUE`, and `VerifyChecklist` requires all sections to have non-NULL destinations. Safety property S2 (`DissolutionChecklistGate`) formally verifies this. Safety property S6 (`MigrationRequiresChecklist`) additionally ensures that no section can be migrated before the checklist is verified. The gate is comprehensive.

### 2. Is the doc-bdd split pattern (eval to expert, production to separate skill) properly captured?

**Partially.** The two-phase split (`unsplit -> eval_to_expert -> complete`) captures the sequencing but not the relocation of production content to project scope. The consensus explicitly says doc-bdd becomes a separate project-scoped skill at `.claude/skills/doc-bdd/SKILL.md`. This relocation is not modeled. Consensus resolution: document as implementation detail.

### 3. Is the TLA+ split (eval to expert-tla, syntax to tla-writer) properly captured?

**Yes, at the same level of abstraction as doc-bdd.** The split follows the identical pattern. The tla-writer destination is implicit (the spec tracks the split status but not which specific files receive content). This is consistent with the spec's abstraction level.

### 4. Does NoContentLoss cover all edge cases?

**No.** It covers CLAUDE.md sections (all must be "migrated" before deletion) but does not cover user-scoped skill content. A skill can be marked "absorbed" without verification that its content was placed. Additionally, if `ClaudeMdSections` is empty, the property is trivially satisfied. The consensus resolution: add a comment documenting the implementation must verify content presence before marking skills absorbed; consider constraining `ClaudeMdSections` to be non-empty.

### 5. Is ReferenceIntegrity strong enough?

**Yes, for the terminal state.** It verifies that when CLAUDE.md is deleted, shared conventions exists and every agent references it. It does not prevent temporary states where an agent has no reference to shared conventions (which is expected during migration). The property is correctly formulated as a post-condition on deletion, not a global invariant.

### 6. Are there missing states or transitions from the design consensus?

**Three items:**
- Missing `ReassignDestination` transition (checklist assignments are irrevocable)
- Missing doc-bdd relocation state (production content to project scope)
- Missing `EventuallyAllAbsorbed` liveness property

### 7. Is SplitOrdering a tautology?

**Yes.** `docBddSplitStatus = "complete" => docBddSplitStatus \in {"eval_to_expert", "complete"}` is trivially true. The ordering is enforced by the transition guards in `CompleteDocBddSplit` (requires `eval_to_expert`) and `CompleteTlaSplit` (requires `eval_to_expert`), which TLC verifies during model checking. The safety property should be removed and the transition guard enforcement documented.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_tla-review-skill-consolidation.md
