# TLA+ Specification: Pipeline Enhancements (PlantUML, Questioner, Librarian, A11y)

## Source
Briefing: `docs/questioner-sessions/2026-04-03_plantuml-questioner-librarian-a11y.md`

## Specification
- **Module:** `PipelineEnhancements.tla`
- **Config:** `PipelineEnhancements.cfg`

## States
- Pipeline stages 1-7 plus terminal state (8 = done)
- Questioner: asking, completeness-checking, finished (voluntary or forced)
- Review gate: collecting reviews, quorum check, gate passed
- Stage 7 fork-join: PlantUML running, librarian running, both done, committed
- Librarian index: valid, stale, partial, corrupt (graceful degradation)
- Expert selection: empty, selected (with/without a11y expert based on topic)
- Deployment: quorum formula + a11y reviewer deployed atomically

## Properties Verified

### Safety (Invariants)
- **TypeOK** -- all variables within declared domains
- **QuorumFloorGuard** -- quorum formula ceil(2n/3) yields >= 1 when n >= 1 (amendment 1)
- **QuorumAtTwoIsUnanimity** -- at n=2, quorum=2 requires unanimity (amendment 8)
- **QuestionerBounded** -- questioner never exceeds MaxTurns (amendment 2)
- **QuestionerCompletenessRequired** -- completeness check runs before questioner finishes (amendment 2)
- **Stage7AtomicCommit** -- PlantUML and librarian both complete before Stage 7 commit (amendment 3)
- **AtomicQuorumDeployment** -- quorum formula and a11y reviewer always deployed together (amendment 5)
- **A11ySelectionCriteria** -- a11y expert selected when topic is frontend-relevant (amendment 6)
- **ReviewGateNonVacuous** -- review gate cannot pass with zero reviews
- **QuestionerMinOneQuestion** -- questionerDone implies at least one question asked (belt-and-suspenders with ASSUME MaxTurns >= 1)
- **DeploymentRequiresReviewGate** -- quorumDeployed implies reviewGatePassed (deployment contingent on review gate)

### Liveness / Temporal
- **QuestionerTerminates** -- questioner eventually finishes (amendment 2)
- **PipelineCompletes** -- pipeline eventually reaches done
- **ForkJoinCompletes** -- Stage 7 fork-join eventually commits after both tasks complete (amendment 3)
- **StageMonotonicity** -- pipeline stages only advance forward: `[][pipelineStage' >= pipelineStage]_pipelineStage`

## Expert Amendments Modeled
1. Quorum formula floor guard (n >= 1 precondition)
2. Freeform questioner termination (completeness criteria + hard turn cap)
3. Stage 7 single atomic commit after fork-join
4. Librarian as Shared Kernel with graceful degradation on stale/partial/corrupt index
5. Quorum + a11y reviewer atomic deployment
6. A11y expert selection criteria (frontend-relevant topics)
7. Split threshold as configurable CONSTANT (SplitThreshold parameter)
8. Quorum at n=2 unanimity documented and verified

## Constant Preconditions (ASSUME)
- `Cardinality(Reviewers) >= 1`
- `Cardinality(Experts) >= 1`
- `MaxTurns >= 1`
- `SplitThreshold >= 1`

## TLC Results
- **States generated:** 7,368
- **Distinct states:** 5,880
- **Initial states:** 12 (nondeterministic librarianIndex x topicKind)
- **Search depth:** 18
- **Result:** PASS (no errors)
- **Workers:** 4
- **Date:** 2026-04-03 (revision pass)
- **Note:** Terminal state deadlock check disabled (-deadlock flag) since pipeline completion is an intentional absorbing state

## Revision History
- **v1 (2026-04-03):** Initial spec -- 3,801 states generated, 2,100 distinct
- **v1-rev1 (2026-04-03):** Stage 4 expert review fixes (6 objections) -- 7,368 states generated, 5,880 distinct. Changes: StageMonotonicity upgraded to temporal property, librarianIndex nondeterministic in Init, DeployQuorumAndA11y guarded by pipelineStage=8, ASSUME statements for constants, QuestionerMinOneQuestion invariant, DeploymentRequiresReviewGate invariant
