# Debate Session — PlantUML Enforcement, Freeform Questioner, Librarian Agent, Accessibility Expert/Reviewer

**Date:** 2026-04-03
**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-ddd, expert-tla, expert-edge-cases, expert-performance, expert-continuous-delivery, expert-tdd

---

## Debate Synthesis — plantuml-questioner-librarian-a11y-design

**Result:** CONSENSUS REACHED
**Rounds:** 2
**Experts:** expert-ddd, expert-tla, expert-edge-cases, expert-performance, expert-continuous-delivery, expert-tdd

---

### Agreed Recommendation

The four-item design (PlantUML enforcement, freeform questioner, librarian agent, accessibility agents) is architecturally sound and should proceed to TLA+ specification with the following mandatory amendments:

1. **Quorum formula floor guard:** The formula `ceil(2n/3)` must include a precondition `n >= 1`. At n=0 the formula yields quorum=0, which is a safety invariant violation (the review gate passes vacuously with zero reviews). The formula and its precondition should be owned by the review-gate specification, not scattered across shared conventions.

2. **Freeform questioner termination:** The questioner must have both (a) defined completeness criteria specifying when the questioner CAN stop, and (b) a hard maximum turn cap specifying when it MUST stop. Without both, the questioner violates liveness (may never terminate) and has unbounded token cost. The completeness criteria must be concrete enough to be testable.

3. **Stage 7 commit strategy:** PlantUML and librarian run in parallel at Stage 7. Both must stage their changes and produce a single commit after the fork-join completes, rather than committing independently. Independent parallel commits create merge conflict races.

4. **Librarian as explicit Shared Kernel:** The "consult first" convention creates a dependency from every agent to `docs/librarian/`. This should be named as a Shared Kernel pattern with a defined contract (the Markdown table schema with columns Path, Kind, Summary, Updated). The contract includes a consistency guarantee: agents must handle stale/partial index gracefully (the existing fallback to direct reads satisfies this).

5. **Quorum + reviewer atomic deployment:** The quorum formula change and the a11y-reviewer addition must be deployed in the same commit. Deploying the formula before the reviewer exists increases quorum requirements before the additional reviewer is available to satisfy them.

6. **A11y expert selection criteria:** The conditional selection of expert-a11y in `selectExperts(topic)` must have defined criteria (keywords, topic patterns, or signals) so that the selection is testable and not opaque.

7. **2,000-token split threshold:** Document as a configurable parameter, not a hardcoded constant. Revisit after the first pipeline runs with real data to validate the threshold against actual index sizes.

8. **Quorum formula at n=2 documented:** At n=2, `ceil(4/3) = 2` requires unanimity. Document this as intentional behavior.

---

### Expert Final Positions

**expert-ddd**
Position: Design is sound in domain separation but the librarian creates an unnamed Shared Kernel and the quorum formula lacks an owning aggregate.
Key reasoning: The "consult first" convention couples every agent to the librarian without modeling that dependency. The quorum formula is a business rule floating without a home — it should be owned by the review-gate specification, which would naturally enforce its own preconditions (n >= 1). The accessibility expert/reviewer split correctly respects the bounded context between design evaluation and implementation review.
Endorsed: expert-tla (quorum n=0 as formal expression of ownership gap), expert-edge-cases (librarian atomicity reinforces Shared Kernel contract), expert-continuous-delivery (deployment sequencing confirms cross-context coordination risk)

**expert-tla**
Position: State machine extension is sound for Stage 7 but quorum formula needs a floor guard and the freeform questioner needs a liveness bound.
Key reasoning: Stage 7 as a parallel fork-join is well-defined with no data dependencies between tasks. The quorum formula at n=0 is a safety invariant violation. The freeform questioner without a turn cap violates liveness — the system may never progress from Stage 1 to Stage 2. Stage 7 needs explicit modeling as a fork-join with a single state and two sub-tasks.
Endorsed: expert-ddd (quorum ownership in review-gate), expert-edge-cases (n=2 unanimity worth documenting), expert-performance (turn cap for token budget), expert-continuous-delivery (single commit after fork-join)

**expert-edge-cases**
Position: Design handles major failures but has gaps in quorum floor, librarian atomicity, questioner termination, and git conflict during parallel Stage 7.
Key reasoning: Quorum at n=0 passes vacuously. Librarian partial writes leave agents reading stale data silently. Freeform questioner has no defined completeness criteria. Stage 7 parallel git commits can conflict. The 2,000-token split threshold has an off-by-one ambiguity (at vs. exceeding 2,000).
Endorsed: expert-tla (hard turn cap as liveness guarantee), expert-ddd (quorum needs owning aggregate), expert-tdd (a11y selection criteria need definition), expert-performance (threshold as tunable parameter)

**expert-performance**
Position: Librarian is high-impact for token efficiency but "consult first" adds mandatory overhead and the 2,000-token threshold is unjustified.
Key reasoning: The librarian replaces O(n) file reads with O(1) index lookups — sound strategy. But "consult first" means every agent starts with an index read, and if the index grows large, this consultation itself becomes a token cost. The threshold should be based on measured data. The freeform questioner needs a hard turn cap for both liveness and token budget reasons.
Endorsed: expert-tla (turn cap is liveness property), expert-continuous-delivery (single commit after fork-join), expert-edge-cases (structural gaps over tuning parameters)

**expert-continuous-delivery**
Position: All four items are independently deployable, but quorum formula change requires atomic deployment with reviewer addition, and Stage 7 needs a defined commit strategy.
Key reasoning: Items 1-2 are file modifications with no migration risk. Items 3-4 are additive and backward-compatible. The quorum formula is the riskiest change — deploying it before the new reviewer increases quorum prematurely. Stage 7 parallel commits must be serialized into a single commit after fork-join completion.
Endorsed: expert-tla (single commit after fork-join), expert-ddd (atomic quorum + reviewer deployment), expert-tdd (quorum formula unit tests)

**expert-tdd**
Position: Design is testable but completeness check, a11y selection criteria, and quorum formula lack test specifications.
Key reasoning: The quorum formula and librarian split threshold are pure-function-testable. The freeform questioner's completeness check is untestable without defined criteria. The a11y expert's conditional selection needs defined rules for testability. The single-commit strategy for Stage 7 is the most testable approach.
Endorsed: expert-tla (hard turn cap makes questioner testable), expert-continuous-delivery (atomic deployment prevents partial state), expert-performance (threshold as configurable parameter)

---

## Round 1 Transcripts

### expert-ddd — Round 1

Position: The design is architecturally sound in its domain separation but has a naming and bounded-context gap in the librarian agent, and the quorum formula change crosses aggregate boundaries without acknowledgment.

Reasoning: The four items are well-scoped. The librarian agent introduces a new bounded context — "Codebase Knowledge" — that all other agents consult. This is effectively a Shared Kernel pattern: every agent depends on the librarian's index. The design correctly makes the librarian non-blocking (fallback to direct file reads), which prevents it from becoming a single point of failure. However, the design does not name this pattern explicitly. The "consult first" instruction in shared conventions creates an implicit coupling between every agent and the librarian without modeling that dependency as a domain relationship.

The quorum formula `ceil(2n/3)` is a policy that belongs to the review-gate domain, not to individual reviewers. The briefing says the formula is "universal for ALL reviewers," which is correct — but where does this formula live? If it is embedded in the design-pipeline orchestrator, it becomes a business rule in an orchestration layer. If it lives in shared conventions, it becomes a cross-cutting concern with no owning aggregate. The formula should be owned by a single artifact — the review-gate definition — and referenced by the orchestrator.

The accessibility expert and reviewer are cleanly separated: the expert participates in debate (Stages 2/4), and the reviewer participates in the review gate (Stage 6). This respects the bounded context between "design evaluation" and "implementation review." The conditional selection of the a11y expert based on topic relevance is consistent with the existing selectExperts(topic) mechanism.

The freeform questioner change is a process improvement within the questioner's bounded context and does not leak into other domains. PlantUML enforcement as an explicit stage is cleaner than a conditional changeFlag — it removes an implicit state from the pipeline.

Objections:
- The librarian's "consult first" convention creates a Shared Kernel dependency that is not named or bounded. Every agent now implicitly depends on docs/librarian/. This should be modeled explicitly as a Shared Kernel with a defined contract (the Markdown table schema).
- The quorum formula ceil(2n/3) has no owning aggregate. It should be owned by the review-gate specification, not scattered across shared conventions or the pipeline orchestrator.

Endorsements: None

### expert-tla — Round 1

Position: The state machine extension is sound for Stage 7 parallelism but the quorum formula introduces a dynamic invariant that must be formally verified at boundary values, and the pipeline state machine needs an explicit transition guard for the new stage.

State Model:
States: STAGE_1 through STAGE_7 (was STAGE_1 through STAGE_6), plus COMPLETE, HALTED.
New transitions:
- STAGE_6_COMPLETE -> STAGE_7_PLANTUML (parallel)
- STAGE_6_COMPLETE -> STAGE_7_LIBRARIAN (parallel)
- STAGE_7_PLANTUML_COMPLETE AND STAGE_7_LIBRARIAN_COMPLETE -> COMPLETE

Reasoning: Stage 7 as a parallel fork-join is well-defined. The two parallel tasks (PlantUML and librarian) have no data dependency on each other, so parallel execution introduces no race conditions. The join condition is straightforward: both must complete (or fail gracefully per the error states). The error states are correctly specified: PlantUML failure does not block COMPLETE, and librarian index corruption falls back to direct reads.

The quorum formula ceil(2n/3) where n is the reviewer count changes a constant to a computed value. At n=9 (with the new a11y-reviewer), quorum = ceil(6) = 6. At n=8 (current), quorum = ceil(16/3) = ceil(5.33) = 6. At n=1, quorum = ceil(2/3) = 1. At n=0, quorum = ceil(0) = 0 — this is a safety violation: a review gate with zero reviewers and zero quorum would pass vacuously. The formula must have a precondition: n >= 1.

The conditional selection of expert-a11y in selectExperts(topic) does not change the state machine — it changes the input set to the debate. This is safe as long as the debate protocol handles a variable number of experts, which it already does.

The freeform questioner removes a deterministic decision tree and replaces it with a non-deterministic interview. From a state machine perspective, this changes the questioner from a finite automaton to a more expressive model. The completeness check before sign-off acts as a guard on the STAGE_1 -> STAGE_2 transition, which is the correct place for it.

Objections:
- The quorum formula ceil(2n/3) has no precondition guard for n=0. If all reviewers are unavailable or the roster is empty, quorum = 0 and the gate passes vacuously. This is a safety invariant violation.
- Stage 7 parallelism needs explicit modeling: is STAGE_7 a single state with two sub-tasks, or two independent states? The pipeline state file has a single "Stage 7" section but two parallel artifacts. The state representation must match the execution model.

Endorsements: None

### expert-edge-cases — Round 1

Position: The design handles major failure modes but has unaddressed edge cases in the librarian split threshold, the quorum formula at small n, and the freeform questioner's termination condition.

Edge Cases Found:
- [Boundary] Librarian index file at exactly 2,000 tokens — does it split or not? "Crosses 2,000 tokens" is ambiguous: does the file split when it reaches 2,000 or when it exceeds 2,000? Off-by-one.
- [Boundary] Quorum formula at n=0: ceil(0) = 0. Zero quorum passes the gate with no reviews.
- [Boundary] Quorum formula at n=1: ceil(2/3) = 1. Single reviewer must approve — correct, but should be documented as intentional.
- [Boundary] Quorum formula at n=2: ceil(4/3) = ceil(1.33) = 2. Both reviewers must approve — unanimous requirement at n=2. Is this intentional?
- [Sequence] Freeform questioner with no completeness check enforcement — what prevents the questioner from signing off after one question? The "completeness check before sign-off" is a guard, but what defines "complete"?
- [Partial failure] Librarian agent fails mid-index-update: half the index is written, half is stale. Is the index atomic? Can agents read a partially written index?
- [Concurrency] Stage 7 parallel execution: PlantUML and librarian both commit to git. Can they conflict? If both modify and commit simultaneously, merge conflicts are possible.
- [Scale] Librarian index grows beyond initial category structure. What triggers new category creation? Is it manual or automatic?
- [Type boundary] A11y expert selected for a purely backend topic (e.g., database schema design). The conditional selection must have clear criteria to avoid noise.

Reasoning: The most serious unhandled case is the quorum formula at n=0. The design should impose a minimum reviewer count or add a floor to the formula. The librarian partial-write scenario is mitigated by the fallback to direct reads, but the index could serve stale data silently — agents would not know the index is corrupted until they find missing entries.

The freeform questioner's termination condition is underspecified. "Completeness check" needs a definition — otherwise, the questioner has unbounded discretion to end the interview early or drag it out indefinitely. This is a liveness concern: the questioner must eventually terminate.

The git conflict during Stage 7 parallel execution is a real operational concern. If PlantUML updates a diagram file and librarian updates docs/librarian/INDEX.md, they touch different files and should not conflict. But if the librarian indexes the PlantUML diagram itself, they could race.

Objections:
- Quorum formula has no floor guard (n=0 yields quorum=0).
- Librarian index writes are not specified as atomic. Partial writes leave agents reading stale/corrupt data with no signal.
- Freeform questioner "completeness check" is undefined — no criteria for what constitutes completeness.
- Stage 7 git commits from parallel tasks could conflict if both touch overlapping files.

Endorsements: None

### expert-performance — Round 1

Position: The librarian agent is the highest-impact item for token efficiency, but the 2,000-token split threshold is arbitrary and the "consult first" pattern adds a mandatory read to every agent invocation — this must be measured.

Reasoning: The librarian's purpose is to reduce token usage across all agents by providing a dense index instead of requiring agents to read full files. This is a sound optimization strategy — replacing O(n) file reads with O(1) index lookups. However, the "consult first" instruction in shared conventions means every agent invocation now starts with at least one file read (the librarian index). If the index grows large (many categories, many entries), the consultation itself becomes a token cost.

The 2,000-token split threshold is presented without justification. Why 2,000? Is this based on measured index sizes, or is it a round number? If the average category file is 500 tokens, splitting at 2,000 wastes capacity. If it is 1,900 tokens, every update triggers a split. The threshold should be based on the expected growth rate of the index and the cost of reading a split file versus a single file.

Stage 7 parallelism is performance-positive: running PlantUML and librarian concurrently rather than sequentially reduces pipeline latency. The error states (both tasks can fail independently without blocking COMPLETE) mean the critical path is max(PlantUML, librarian) rather than the sum.

The quorum formula ceil(2n/3) does not have a direct performance impact, but increasing quorum from 5 to 6 (at n=9) means one more reviewer must complete before the gate passes. If reviewers run in parallel (which they do per the existing design), the impact is minimal — it only matters if the 6th reviewer is significantly slower than the 5th.

The freeform questioner could be a performance concern if interviews become unbounded. The fixed decision tree had a natural termination (10 branches). Freeform interviews need a practical bound — not just a completeness check, but a maximum turn count to prevent token waste.

Objections:
- The 2,000-token split threshold is unjustified. It should be derived from measured index sizes and agent read costs, not chosen arbitrarily.
- The "consult first" pattern adds mandatory overhead to every agent invocation. The net token savings must be positive — if the index is large, consultation could cost more than it saves.
- Freeform questioner has no maximum turn bound. Without one, a single questioner session could consume unbounded tokens.

Endorsements: None

### expert-continuous-delivery — Round 1

Position: The design is deployable incrementally — each of the four items can be shipped independently — but the Stage 7 addition and quorum formula change require careful sequencing to avoid breaking the existing pipeline.

Reasoning: The four items have different deployment profiles. Items 1 (PlantUML enforcement) and 2 (freeform questioner) are modifications to existing SKILL.md files — they can be deployed as file updates with no migration risk. Item 3 (librarian agent) introduces new files (docs/librarian/, AGENT.md) and modifies shared conventions — this is additive and backward-compatible as long as existing agents can function without the librarian (which the fallback ensures). Item 4 (a11y agents) adds new files and modifies the reviewer roster — additive and backward-compatible.

The quorum formula change from fixed 5 to ceil(2n/3) is the riskiest deployment. If the formula is deployed before the 9th reviewer is added, the quorum at n=8 becomes 6 (up from 5). This is a behavioral change to the existing pipeline that could cause previously-passing gates to require one more approval. The deployment order must be: (1) add a11y-reviewer to the roster, (2) then change the quorum formula. Reversing this order increases the quorum before the additional reviewer exists to fill it.

Stage 7 as an additive stage is low-risk: existing pipelines that terminate at Stage 6 will not break. The new stage runs after Stage 6 COMPLETE, so it cannot affect the existing flow. However, the pipeline state file format changes (new Stage 7 section), and any tooling that parses the state file must handle the new section.

The librarian's git commits in Stage 7 introduce a new commit pattern. If the pipeline already commits at the end (Git section in pipeline-state.md), the librarian's mid-pipeline commit could create unexpected git history. The commit strategy should be documented: does Stage 7 commit independently, or does it stage changes for the final pipeline commit?

Objections:
- Quorum formula deployment must be sequenced after the a11y-reviewer addition. Deploying the formula first increases quorum before the new reviewer is available.
- Librarian git commit strategy in Stage 7 is unspecified. Does it commit independently or stage for a final commit? Independent commits in a parallel stage could create merge issues.

Endorsements: None

### expert-tdd — Round 1

Position: The design is structurally testable but lacks explicit test specifications for the new agents and the quorum formula, and the freeform questioner's completeness check is untestable without defined criteria.

Reasoning: Each new artifact (librarian AGENT.md, expert-a11y SKILL.md, a11y-reviewer AGENT.md) defines behavior that should be verifiable. The librarian's index schema (Markdown table with Path, Kind, Summary, Updated columns) is testable — you can write tests that validate index entries against the schema. The split threshold (2,000 tokens) is testable — you can write a test that verifies a file splits when crossing the threshold. The quorum formula ceil(2n/3) is trivially testable as a pure function.

The freeform questioner's completeness check is the least testable element. Without defined criteria for "complete," there is no way to write a test that asserts the questioner correctly identifies an incomplete interview versus a complete one. This is a design gap, not a test gap — the behavior is underspecified.

The a11y expert's conditional selection in selectExperts(topic) is testable if the selection criteria are defined. The briefing says "conditional selection" but does not specify what conditions trigger selection. For test-first development, I need to know: given a topic X, should expert-a11y be selected? What keywords, patterns, or signals trigger it?

The existing pipeline has no test suite for agent behavior (agents are SKILL.md/AGENT.md files interpreted by Claude, not executable code), so "testability" here means: can the design be validated by running the pipeline and checking outputs? The answer is yes for most items, but the quorum formula and librarian split logic should also have unit tests if they are implemented as code.

Objections:
- Freeform questioner completeness check has no testable criteria. Without a definition, it cannot be verified.
- A11y expert conditional selection criteria are unspecified. The selectExperts(topic) function needs defined rules for when a11y expertise is relevant.
- The quorum formula and librarian split threshold should have unit tests, not just behavioral validation through pipeline runs.

Endorsements: None

## Round 2 Transcripts

### expert-ddd — Round 2

Position: Unchanged. The Shared Kernel concern and quorum ownership gap remain. Other experts have reinforced these with related objections.

Reasoning: The quorum n=0 guard (expert-tla, expert-edge-cases) is a symptom of the ownership problem I raised: if the quorum formula had an owning aggregate (the review-gate specification), that aggregate would naturally enforce its own preconditions, including n >= 1. The fact that multiple experts independently found this gap confirms the formula is floating without a home.

The librarian atomicity concern (expert-edge-cases) is valid and reinforces the Shared Kernel argument: if agents depend on the librarian index, the contract must include consistency guarantees. A Shared Kernel with no consistency model is not a contract — it is a hope.

The deployment sequencing concern (expert-continuous-delivery) about quorum formula vs. reviewer addition order is a bounded-context coordination issue. This is exactly the kind of problem that arises when a policy (quorum formula) spans two bounded contexts (reviewer roster and pipeline orchestrator).

Objections: None new. Prior objections stand.

Endorsements:
- expert-tla: The quorum n=0 safety invariant is the formal expression of the ownership gap I raised. Agreed.
- expert-edge-cases: Librarian atomicity concern reinforces the Shared Kernel contract argument.
- expert-continuous-delivery: Deployment sequencing of quorum + reviewer confirms the cross-context coordination risk.

### expert-tla — Round 2

Position: Unchanged. The n=0 guard and Stage 7 state representation concerns stand. I endorse several related objections.

Reasoning: The freeform questioner termination concern (expert-performance, expert-edge-cases, expert-tdd) is a liveness property I should have raised in Round 1. A freeform interview without a maximum turn bound violates liveness: the system may never progress from STAGE_1 to STAGE_2. The completeness check is a necessary but insufficient guard — it needs a hard cap (e.g., maximum 20 turns) as a liveness guarantee.

The git conflict concern for Stage 7 parallel commits (expert-edge-cases, expert-continuous-delivery) is a concurrency issue. If both PlantUML and librarian commit independently, the second commit may fail if the first has pushed. This is a classic compare-and-swap race. The resolution is either: (a) serialize commits (one commits first, other commits second), or (b) stage all changes and commit once after both complete.

Expert-ddd's point about quorum formula ownership is well-taken from a state machine perspective: the quorum invariant (n >= 1 AND quorum = ceil(2n/3)) should be co-located with the review-gate state definition.

Objections: None new. Prior objections stand.

Endorsements:
- expert-ddd: Quorum formula ownership should be co-located with the review-gate definition. Agreed — this is where the invariant guard naturally belongs.
- expert-edge-cases: Quorum at n=2 requiring unanimity is worth documenting as intentional behavior.
- expert-performance: Freeform questioner needs a hard turn cap for liveness. Agreed — this is a liveness property.
- expert-continuous-delivery: Stage 7 commit strategy must be defined to avoid race conditions.

### expert-edge-cases — Round 2

Position: Unchanged. Key gaps remain around quorum floor, librarian atomicity, and questioner termination. Other experts have converged on these same issues.

Reasoning: I see strong convergence across all experts on three core issues: (1) quorum formula floor guard, (2) freeform questioner termination/completeness definition, and (3) Stage 7 git commit strategy. These are not conflicting opinions — they are the same gaps seen from different angles.

Expert-performance's point about the 2,000-token threshold being unjustified is valid but lower severity. It is a tuning parameter that can be adjusted after measurement. The structural gaps (quorum floor, questioner termination, commit strategy) are design defects that should be fixed before implementation.

Expert-tdd's point about a11y expert selection criteria is valid — the briefing says "conditional selection" without defining the conditions. This is not an edge case per se, but it creates an untestable branch in the expert selection logic.

Objections: None new. Prior objections stand.

Endorsements:
- expert-tla: Freeform questioner needs a hard turn cap as a liveness guarantee. Agreed — this prevents unbounded sessions.
- expert-ddd: Quorum formula needs an owning aggregate with co-located preconditions. Agreed.
- expert-tdd: A11y selection criteria need definition for testability. Agreed — without criteria, the condition is opaque.
- expert-performance: 2,000-token threshold should be validated by measurement. Agreed, though lower priority than structural gaps.

### expert-performance — Round 2

Position: Unchanged. Token overhead of "consult first" and threshold justification remain concerns. Convergence on questioner termination is encouraging.

Reasoning: The convergence on freeform questioner termination (expert-tla adding liveness framing, expert-edge-cases confirming) strengthens the case for a hard turn cap. This is both a token budget concern (unbounded turns = unbounded cost) and a correctness concern (liveness).

Expert-tla's point about Stage 7 commit serialization is the right resolution for the git conflict issue. Staging all changes and committing once after both parallel tasks complete eliminates the race entirely and is simpler than coordinating two independent commits.

The threshold discussion (2,000 tokens) is acknowledged as a tuning parameter. I accept expert-edge-cases' assessment that this is lower priority than the structural gaps, but I want it documented as a parameter that should be revisited after the first few pipeline runs with real data.

Objections: None new. Prior objections stand.

Endorsements:
- expert-tla: Hard turn cap for questioner is a liveness property. Agreed — and also a token budget guard.
- expert-continuous-delivery: Single commit after Stage 7 fork-join completes is the cleanest strategy. Agreed.
- expert-edge-cases: Structural gaps (quorum floor, questioner termination, commit strategy) take priority over tuning parameters. Agreed.

### expert-continuous-delivery — Round 2

Position: Unchanged. Deployment sequencing and commit strategy concerns stand. Strong convergence visible.

Reasoning: Expert-tla's proposal to serialize Stage 7 commits (stage all, commit once) is the correct resolution. This is simpler, avoids merge conflicts, and produces cleaner git history. I endorse this as the recommended commit strategy.

The deployment sequencing concern (add reviewer before changing quorum formula) is acknowledged by expert-ddd as a bounded-context coordination issue. The practical resolution is simple: the implementation PR should add the a11y-reviewer to the roster in the same commit that changes the quorum formula. Atomic deployment eliminates the sequencing risk.

Expert-tdd's point about unit tests for the quorum formula is well-taken from a CD perspective: a formula change that lacks tests is a regression risk. The formula is simple enough that a test is trivial to write — there is no reason not to have one.

Objections: None new. Prior objections stand.

Endorsements:
- expert-tla: Single commit after Stage 7 fork-join. Agreed — cleaner git history and no race conditions.
- expert-ddd: Quorum + reviewer should deploy atomically. Agreed — same commit eliminates sequencing risk.
- expert-tdd: Quorum formula should have unit tests. Agreed — trivial to write, prevents regression.

### expert-tdd — Round 2

Position: Unchanged. Testability gaps in completeness check and a11y selection criteria remain. Convergence on quorum testing is positive.

Reasoning: The convergence on freeform questioner termination from multiple angles (liveness via expert-tla, edge cases via expert-edge-cases, token budget via expert-performance) confirms this is a real design gap, not just a testing concern. The completeness check needs defined criteria AND a hard turn cap. Both are needed: the criteria define when the questioner CAN stop, and the cap defines when it MUST stop.

Expert-continuous-delivery's endorsement of quorum formula unit tests confirms this is achievable and expected. The quorum formula, librarian split threshold, and a11y selection criteria are all pure-function-testable if their logic is specified clearly enough.

The single-commit strategy for Stage 7 (expert-tla, expert-continuous-delivery) is the right call and is also the most testable: you can verify the commit contains both PlantUML and librarian changes in a single assertion.

Objections: None new. Prior objections stand.

Endorsements:
- expert-tla: Hard turn cap as liveness guarantee for questioner. Agreed — and it makes the questioner's behavior testable by bounding the output space.
- expert-continuous-delivery: Atomic deployment of quorum formula + reviewer addition. Agreed — prevents partial deployment.
- expert-performance: 2,000-token threshold as a tunable parameter to revisit. Agreed — document it as configurable, not hardcoded.
