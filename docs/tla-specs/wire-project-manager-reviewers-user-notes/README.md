# TLA+ Specification: Reviewer Gate

## Source
Briefing: `docs/questioner-sessions/2026-04-03_wire-project-manager-reviewers-user-notes.md`

## Specification
- **Module:** `ReviewerGate.tla`
- **Config:** `ReviewerGate.cfg`

## States
- **PENDING** -- task awaiting local review
- **LOCAL_REVIEW** -- pair session performing self-review
- **REVIEWING** -- all 8 reviewers dispatched in parallel
- **REVIEW_PASSED** -- all responded reviewers passed, quorum met
- **REVIEW_FAILED** -- at least one responded reviewer failed, quorum met
- **REVISING** -- pair revising based on reviewer findings
- **MERGED** -- task merged to integration branch
- **FAILED** -- terminal failure (revision limit exhausted or no quorum)

Reviewer states per task: IDLE, RUNNING, PASS, FAIL, UNAVAILABLE

## Properties Verified
### Safety (Invariants)
- **TypeOK** -- all variables within declared domains
- **RevisionBounded** -- review-revision cycles never exceed MaxReviewRevisions
- **ReviewerRetriesBounded** -- per-reviewer retries never exceed MaxReviewerRetries
- **MergeOnlyAfterReviewPass** -- a task can only reach MERGED if all responded reviewers gave PASS
- **ReviewersOnlyDuringReviewing** -- no reviewer is RUNNING unless the task is in REVIEWING state
- **NoQuorumBlocksMerge** -- REVIEW_PASSED requires quorum of responsive reviewers

### Liveness
- **TaskEventuallyTerminal** -- every task eventually reaches MERGED or FAILED
- **ReviewEventuallyResolves** -- every REVIEWING state eventually resolves to REVIEW_PASSED, REVIEW_FAILED, or FAILED

## TLC Results
- **States explored:** 14,151
- **Distinct states:** 5,996
- **Result:** PASS
- **Workers:** 4
- **Date:** 2026-04-03

## Model Parameters
- Tasks = {t1} (1 task)
- Reviewers = {r1, r2, r3} (3 reviewers, scaled from production 8)
- MaxReviewRevisions = 2
- MaxReviewerRetries = 1
- MinReviewQuorum = 2

## Design Decisions Modeled
1. **Reviewer states in task state machine** -- REVIEWING, REVIEW_PASSED, REVIEW_FAILED, REVISING added to TaskStates
2. **Bounded review-revision cycle** -- MaxReviewRevisions constant caps full cycles; exhaustion leads to FAILED
3. **Structured ReviewVerdict** -- PASS/FAIL verdict with SESSION_DIFF/OUT_OF_SCOPE scope per reviewer
4. **Reviewer crash/timeout with fallback** -- bounded retries per reviewer; exhausted reviewers marked UNAVAILABLE; quorum gate (MinReviewQuorum) ensures enough reviewers respond
5. **Full re-run on revision** -- CompleteRevision resets all reviewer state for complete re-evaluation
6. **No-quorum escalation** -- if too many reviewers are UNAVAILABLE, task fails (escalate to user)

## Prior Versions
None
