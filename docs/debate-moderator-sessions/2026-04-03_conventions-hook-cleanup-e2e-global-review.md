# Debate Session — conventions-hook-cleanup-e2e-global-review

**Date:** 2026-04-03
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-tla

---

## Debate Synthesis — conventions-hook-cleanup-e2e-global-review

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-tla

---

### Agreed Recommendation

The design is sound and complete with four amendments that must be incorporated before implementation:

1. **Inline-fix termination guard:** Each step within a global review pass gets at most 1 inline fix attempt by the project-manager. If the step fails again after the inline fix, the entire full-sequence restarts and fixCount increments. This makes the termination guarantee provable: every failure path either resolves (step passes after inline fix) or increments fixCount toward MaxGlobalFixes (3). The state transition is:
   - `FIX_IN_PROGRESS(step, pass, retry=0)` -> re-run step (retry=1)
   - Step fails again with retry=1 -> `RESTARTING_SEQUENCE(fixCount+1)`
   - `RESTARTING_SEQUENCE(k >= MaxGlobalFixes)` -> `EXHAUSTED`

2. **Negative assertion for cleanup verification:** The e2e test must include a 7th validation dimension: scan all agent .md files and assert that NONE contain a direct conventions.md read instruction (e.g., `Read shared conventions` or similar variants). This catches incomplete cleanup.

3. **Handoff contract concrete definition:** "Cross-agent handoff contracts" in the e2e test must be defined concretely: (a) each agent SKILL.md has a "Handoff" section, (b) each handoff target references a file that exists on disk, (c) stage-to-agent mapping is bidirectional (the agent's handoff section names the correct next stage).

4. **Hook path validation in e2e test:** The e2e test should validate that the hook's `additionalContext` path (`.claude/skills/shared/conventions.md`) resolves to an existing file on disk. This catches silent hook failures caused by file moves or renames.

Additionally, one minor recommendation was agreed upon:
- Add a breadcrumb comment to conventions.md noting that the quorum formula is now owned by `project-manager/AGENT.md`, so future maintainers know where to find it.
- Implement hook addition BEFORE agent file cleanup in the commit ordering, so any mid-implementation interruption does not leave agents with no conventions.md source.

---

### Expert Final Positions

**expert-tdd**
Position: The design is sound with the amendments above. The e2e test with 7 dimensions (original 6 + negative cleanup assertion) provides strong structural regression coverage.
Key reasoning: The double-pass protocol is testable once the inline-fix escalation trigger is specified (per-step retry cap of 1). The e2e test dimensions are concrete and fast (filesystem reads, no mocking). The negative assertion for cleanup is essential -- without it, partial cleanup is undetectable by the test suite.
Endorsed: expert-tla (state model enumeration and termination gap identification), expert-edge-cases (negative assertion for cleanup, path validation)

**expert-edge-cases**
Position: The design addresses its own identified edge cases adequately, with the termination guard amendment closing the most critical gap.
Key reasoning: The 27-file cleanup with variant text is the highest-risk implementation task. The negative assertion catches incomplete cleanup. The hook silent-failure mode is mitigated by the e2e test validating both hook existence and path resolution. Non-deterministic tool outputs (flaky tests) are bounded by the per-step retry cap -- a flaky step that fails twice triggers a restart, and 3 restarts hit EXHAUSTED.
Endorsed: expert-tla (state model and termination gap are the core contribution), expert-tdd (concrete test dimension recommendations)

**expert-continuous-delivery**
Position: This is a clean infrastructure consolidation that reduces configuration drift. The pipeline reliability concern (unbounded loops) is resolved by the per-step retry cap.
Key reasoning: Moving from 27 distributed instructions to one centralized hook is a net reduction in maintenance burden. The single-commit approach eliminates deployment-time partial-state risk. The quorum formula ownership transfer to PM is acceptable with a breadcrumb comment for discoverability.
Endorsed: expert-tla (termination gap identification), expert-edge-cases (hook-before-cleanup ordering), expert-tdd (negative cleanup assertion)

**expert-tla**
Position: The double-pass protocol is well-designed once the inline-fix boundary is formalized. The state model has a clear termination guarantee with the per-step retry cap amendment.
Key reasoning: The original briefing left the FIX_IN_PROGRESS -> RESTARTING_SEQUENCE transition implicit. With the per-step retry cap of 1, every path through the state model either reaches SUCCESS (two consecutive clean passes) or EXHAUSTED (fixCount >= MaxGlobalFixes). No infinite loops are possible. The state space is bounded: MaxGlobalFixes(3) * StepsPerPass(3) * PassesRequired(2) = finite.
Endorsed: expert-edge-cases (bounded-retry-per-step proposal resolves the termination gap), expert-tdd (7th test dimension for negative cleanup assertion), expert-continuous-delivery (pipeline reliability framing)

---

### Endorsement Map

| Expert | Endorsed by |
|--------|------------|
| expert-tla (state model + termination gap) | expert-tdd, expert-edge-cases, expert-continuous-delivery |
| expert-edge-cases (negative assertion, path validation, bounded retry) | expert-tdd, expert-tla, expert-continuous-delivery |
| expert-tdd (7th test dimension, concrete handoff definition) | expert-edge-cases, expert-tla |
| expert-continuous-delivery (pipeline reliability, breadcrumb comment) | expert-tla |

---

## Round Transcripts

### Round 1

**expert-tdd**

Position: The design is sound in its test coverage ambitions, but the e2e test dimensions need sharper specification, and the double-pass protocol must be testable without running the entire pipeline.

Reasoning: The proposal to create a pipeline e2e test with 6 validation dimensions (stage ordering, agent file existence, cross-agent handoff contracts, state transition completeness, reviewer roster completeness, stage-to-agent mapping) is commendable. These are structural assertions that can run in milliseconds by reading the filesystem and parsing markdown -- no mocking needed. However, the briefing does not specify what "cross-agent handoff contracts" means concretely in test code. The test will be as good as its assertion specificity. The double-pass protocol introduces a state machine that is itself testable, but the briefing says "fixes within a pass handled inline by project-manager" without specifying what triggers an inline fix vs. a full-sequence restart. The test cannot encode the PM's judgment if the condition is not specified.

Objections:
- "Cross-agent handoff contracts" is underspecified -- the test cannot validate something that is not precisely defined.
- The double-pass clean-pass counter reset semantics (inline fix vs. outer loop restart) need explicit specification before implementation.

Endorsements: None

---

**expert-edge-cases**

Position: The design has several unaddressed edge cases, particularly around the atomicity of the 27-file cleanup and the hook injection's silent failure mode.

Edge Cases Found:
- [Partial failure] Hook injection succeeds but some agent files fail cleanup due to variant text not matching expected pattern -- inconsistent state
- [Sequence violation] Hook added AFTER agent files cleaned; interruption leaves agents with no conventions.md source
- [Boundary] Agent file has conventions.md instruction embedded in a larger paragraph rather than standalone line
- [External dependency] PreToolUse hook schema changes or matcher syntax wrong -- hook fires but injects nothing silently
- [Double-pass] Non-deterministic tool outputs cause oscillation without converging, wasting MaxGlobalFixes iterations

Reasoning: The 27-file cleanup with "slightly different instruction text" is the highest-risk task. String matching for removal on 27 variants is fragile. The e2e test validates agent file existence but does not validate that conventions.md instructions have been fully removed -- a negative assertion is needed. The hook silent-failure mode is partially mitigated by the e2e test, but the test should validate both hook existence and path correctness.

Objections:
- The 27-file cleanup lacks a verification step (negative assertion that no agent file still contains the old instruction)
- Non-deterministic tool outputs can cause the double-pass to oscillate without converging
- The ordering of hook addition vs. file cleanup is not specified

Endorsements: None

---

**expert-continuous-delivery**

Position: The design is a clean infrastructure improvement that reduces configuration debt. The atomicity concern is manageable since all changes land in a single commit.

Reasoning: Moving from 27 distributed instructions to one centralized hook reduces configuration drift. New agents automatically get conventions.md via the hook. The e2e test provides a regression gate. The double-pass MaxGlobalFixes cap ensures pipeline termination. The quorum formula moving to PM trades discoverability for ownership clarity.

Objections:
- Quorum formula moving to PM prompt reduces discoverability for future maintainers.

Endorsements: None

---

**expert-tla**

Position: The double-pass protocol is the most state-heavy component and needs explicit state enumeration. The counter semantics are implicit.

State Model:
```
States: IDLE, RUNNING_PASS(step, passNumber), FIX_IN_PROGRESS(step, passNumber),
        CLEAN_PASS_1_COMPLETE, CLEAN_PASS_2_COMPLETE(=SUCCESS),
        RESTARTING_SEQUENCE(fixCount), EXHAUSTED
Transitions:
  IDLE -> RUNNING_PASS(test, 1)                    [pipeline enters global review]
  RUNNING_PASS(step, n) -> FIX_IN_PROGRESS(step, n) [step produces failures]
  RUNNING_PASS(step, n) -> RUNNING_PASS(next, n)    [step is clean]
  FIX_IN_PROGRESS(step, n) -> RUNNING_PASS(step, n) [PM fixes inline, re-runs]
  RUNNING_PASS(tsc, n) -> CLEAN_PASS_1_COMPLETE      [all steps clean, n=1]
  RUNNING_PASS(tsc, n) -> SUCCESS                     [all steps clean, n=2]
  CLEAN_PASS_1_COMPLETE -> RUNNING_PASS(test, 2)     [start pass 2]
  FIX_IN_PROGRESS(*, n) -> RESTARTING_SEQUENCE(+1)   [fix applied, reset]
  RESTARTING_SEQUENCE(k<3) -> RUNNING_PASS(test, 1)  [restart]
  RESTARTING_SEQUENCE(k>=3) -> EXHAUSTED              [halt]
```

Reasoning: The briefing says "fixes within a pass handled inline by PM" and "MaxGlobalFixes caps outer loop." This implies inline fixes are free (no counter increment) and only full-sequence restarts increment fixCount. But the trigger for escalating from inline fix to full restart is not defined. Without this guard, the PM can apply infinite inline fixes without ever incrementing fixCount, breaking the termination guarantee.

Objections:
- The boundary between "inline fix" and "full-sequence restart" is undefined -- no escalation trigger
- The state model needs to specify whether an inline fix re-runs only the failing step or restarts from step 1 of the current pass

Endorsements: None

---

### Round 2

**expert-tdd**

Position: Unchanged. The TLA+ expert's termination gap strengthens the testability concern.

Reasoning: expert-tla correctly identified that the double-pass has two fix levels with no escalation trigger. This is a testability concern: a test for "when does PM restart the full sequence" requires a specified condition. expert-edge-cases' negative assertion is a concrete, fast test dimension that should be added.

Objections:
- (Reiterated) The inline-fix escalation trigger must be specified.

Endorsements:
- expert-tla: The state model enumeration is the kind of rigor the double-pass needs. The termination gap is the most critical design gap.
- expert-edge-cases: The negative assertion for conventions.md removal should be a 7th validation dimension.

---

**expert-edge-cases**

Position: Unchanged. expert-tla's state model confirms the termination gap.

Reasoning: If inline fixes are free and a flaky tool keeps producing failures, the PM applies infinite inline fixes without hitting MaxGlobalFixes. Every fix must either increment fixCount or have a bounded retry count. The per-step retry cap of 1 is the correct resolution.

Objections:
- (Reiterated) Inline fixes must have a bounded retry count or increment fixCount.
- (New) The e2e test should validate that the hook's additionalContext path resolves to an existing file.

Endorsements:
- expert-tla: The state model is the correct framing. The FIX_IN_PROGRESS ambiguity is the core issue.
- expert-tdd: "Cross-agent handoff contracts" needs concrete definition.

---

**expert-continuous-delivery**

Position: Adjusted. The termination gap is a real pipeline reliability concern.

Reasoning: A pipeline stage that loops indefinitely blocks the deployment queue. The per-step retry cap (1 retry, then full restart incrementing fixCount) resolves this. Quorum discoverability concern is resolved by a breadcrumb comment.

Objections: None new. Quorum concern withdrawn (resolved by breadcrumb comment).

Endorsements:
- expert-tla: The termination gap is real and needs resolution.
- expert-edge-cases: Hook-before-cleanup ordering is sound practice.
- expert-tdd: The negative assertion is a valuable test addition.

---

**expert-tla**

Position: Unchanged. The inline-fix boundary is resolvable with the per-step retry cap.

Reasoning: With per-step retry cap of 1: step fails -> inline fix -> re-run step. If step fails again -> full restart, fixCount+1. This gives a concrete transition guard. Termination is provable: each step fails at most once per pass before restart, restarts capped at 3.

Objections: None new. The inline-fix boundary is now resolvable.

Endorsements:
- expert-edge-cases: Bounded-retry-per-step is the correct resolution.
- expert-tdd: 7th test dimension (negative assertion) is needed.
- expert-continuous-delivery: Pipeline reliability framing is well-articulated.

---

**Session saved to:** docs/debate-moderator-sessions/2026-04-03_conventions-hook-cleanup-e2e-global-review.md
