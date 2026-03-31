# Debate Session — Pair Programming Stage Design

**Date:** 2026-03-30
**Result:** CONSENSUS REACHED
**Rounds:** 4
**Experts:** expert-tdd, expert-continuous-delivery, expert-edge-cases

---

## Agreed Recommendation

The Stage 6 (Pair Programming) design is viable and should proceed with 27 amendments addressing ping-pong protocol refinements, commit/merge strategy, tier execution, error handling, and platform constraints.

### Ping-Pong Protocol Refinements

1. **Test quality gate:** Tests must compile, fail for behavioral reasons (not syntax errors), and use non-trivial inputs. A test that fails because of a typo or missing import is not a valid red step.
2. **Next-increment handshake:** Before each TDD cycle, the test writer proposes which behavior to test next and the code writer confirms or adjusts. This prevents scope drift within cycles.
3. **In-cycle refactor review:** The test writer reviews the passing implementation after each green step, not just at session end. This enforces the refactor phase of red-green-refactor.
4. **Test validation step:** Distinguish "fails because feature is missing" from "fails because test is broken." Only the former is a valid red step.
5. **Unit vs integration test distinction:** Sessions should explicitly separate unit test cycles (fast, isolated) from integration test cycles (multi-step transitions). The test type affects cycle dynamics and execution speed.
6. **Invalid test handling:** If the test writer produces a test that cannot compile or run, the protocol must define a recovery action (test writer revises, not code writer).

### Commit & Merge Strategy

7. **Commit per TDD cycle:** Each red-green-refactor produces a commit in the worktree. This makes TDD discipline auditable and supports bisect.
8. **No-squash on tier branches:** Preserve the full TDD commit history on working branches. The test-before-implementation ordering is the only machine-verifiable evidence that TDD was followed.
9. **Merge commit to integration branch:** Use `--no-ff` merge so `git log --first-parent` reads cleanly while preserving detailed history.
10. **Serialize merges within a tier:** Merges from parallel worktrees to the integration branch must be serialized via a queue/lock. Parallel merges are a race condition.
11. **Post-merge test run:** After each individual merge within a tier, run the full test suite before proceeding to the next merge.
12. **Cross-tier merge conflicts = escalation:** If a cross-tier merge conflict occurs, treat it as a task-graph defect (Stage 5 got the dependencies wrong), not a routine fix. Escalate to user or back to implementation-writer.

### Tier Execution

13. **Integration test between tiers:** After all merges in a tier complete, run the full accumulated test suite before spawning the next tier's worktrees. This catches cross-tier regressions early.
14. **Verified baseline for next tier:** Tier N+1 worktrees must be created from a post-merge state that has passed type-check and full test suite.
15. **Type exports for downstream tiers:** Tier N's merged code must include type exports and barrel files so Tier N+1 test writers can import real types, not guess at interfaces.
16. **Rollback path for completed tiers:** If Tier N+1 reveals Tier N's code is fundamentally wrong (not a merge conflict but a design error), escalate to user. The orchestrator cannot unilaterally revert a completed tier.
17. **Cycle detection in task graph:** Before dispatching any tier, validate the dependency DAG for cycles. A cyclic dependency means the task graph is malformed — escalate to user.
18. **Artifact lineage validation:** Verify that Stage 6's task assignments trace back to valid Stage 5 implementation steps which trace to valid TLA+ states/transitions.

### Error Handling & Re-dispatch

19. **Re-dispatch inherits context:** A re-dispatched pair receives: all passing commits from the failed session, the last valid failing test, error output from the failure, and a summary of what was attempted.
20. **Full reset only on corruption:** Only reset the worktree to a clean state if the filesystem is corrupted (not recoverable logic errors). Logic errors inherit passing work.
21. **Idempotent re-dispatch:** Before re-dispatching, ensure the tier branch is clean of all artifacts from the failed attempt. Revert any partial merge from the failed session.
22. **Worktree cleanup:** On session failure, archive the worktree's diff to a temporary location for diagnostics, then delete the worktree before re-dispatch to prevent disk/path conflicts.
23. **Bounded cross-review:** The mutual cross-review loop (test writer reviews code, code writer reviews tests) must have a bounded iteration count. If issues persist after N rounds, escalate.
24. **Global review hard cap:** Maximum 3 global-review fix iterations. If issues remain after 3 rounds, escalate to user with a concrete failure report.

### Platform & Resource Constraints

25. **Windows parallelism cap:** Maximum 3 concurrent worktrees on Windows. Path length limits (MAX_PATH), I/O contention from parallel `node_modules` resolution, and Windows Defender scanning make higher parallelism unreliable.
26. **Session context budget:** Define maximum concurrent agent sessions and a policy for context exhaustion mid-TDD-cycle (e.g., summarize accumulated context and retry, or fail the task).
27. **Durable terminal artifact:** Stage 6 must produce a commit on a named branch, not uncommitted files. Uncommitted code is volatile — a crash or timeout loses all work.

### Additional Recommendations (not objections, but design guidance)

- **Shared test naming convention:** All pair sessions should follow a consistent test file naming and organization pattern. Include this as part of the session inputs.
- **Pipeline observability:** Surface timing per tier and per review cycle so the user can diagnose slow or stuck pipelines.
- **Test execution speed targets:** Unit tests should run in <50ms per test. Playwright tests must be isolated per worktree with no shared browser state.

---

## Expert Final Positions

### expert-tdd

**Position:** Support
**Key reasoning:** The ping-pong protocol with separated agents enforces TDD by construction. Adding test quality gates, in-cycle refactor review, and commit-per-cycle makes the discipline auditable and verifiable. The distinction between unit and integration test cycles ensures appropriate feedback loop speed.
**Endorsed:** CD commit granularity, CD cross-tier escalation, Edge hard cap, Edge merge serialization, Edge Windows constraints, Edge test validation, CD integration tests between tiers, CD terminal artifact, Edge deadlock detection, Edge context budget, Edge idempotent re-dispatch

### expert-continuous-delivery

**Position:** Support
**Key reasoning:** Tier-based execution with serialized merge queues and post-merge verification mirrors CI/CD best practices. Each tier is a mini-integration boundary. Commit history preservation enables bisect. Integration tests between tiers provide fast feedback at natural boundaries.
**Endorsed:** TDD test quality gate, TDD re-dispatch inherits tests, TDD scope handshake, TDD unit/integration distinction, Edge hard cap, Edge merge serialization, Edge idempotency, Edge Windows constraints, Edge deadlock detection, Edge worktree cleanup

### expert-edge-cases

**Position:** Support
**Key reasoning:** The 27 amendments close the most dangerous failure modes: unbounded loops (hard cap), merge races (serialization), lost work (commit-per-cycle + durable artifact), re-dispatch drift (idempotency + context inheritance), and platform constraints (Windows parallelism cap).
**Endorsed:** TDD test quality gate, TDD scope handshake, TDD refactor review, CD commit granularity (accepted no-squash), CD terminal artifact, CD integration tests between tiers, CD rollback path, CD artifact lineage

---

## Resolved Disagreements

### Squash vs no-squash on merge

- **Round 1-2:** Edge preferred squash-per-task; TDD and CD wanted no-squash to preserve TDD audit trail
- **Resolution (Round 4):** All three experts agreed: no-squash on tier branches to preserve TDD commit history. Use merge commits (`--no-ff`) to integration branch so `--first-parent` reads cleanly. The detailed commits remain reachable but don't clutter the top-level history.

### Reset vs inherit on re-dispatch

- **Round 1:** Edge recommended full reset; TDD preferred inheriting passing work
- **Resolution (Round 3-4):** All three agreed: inherit passing commits + valid failing test + diagnostic context. Full reset only for filesystem corruption. Combined with idempotency guarantee (clean tier branch of failed artifacts).

---

## Round Transcripts

### Round 1

All three experts: Support with concerns. Initial objections raised (items 1-13).

### Round 2

All three experts: Support with concerns (unchanged). Strong cross-endorsement. New objections (items 14-21). Squash disagreement surfaced.

### Round 3

All three experts: Converging. New objections (items 22-27). No-squash argument strengthened by TDD and CD.

### Round 4

All three experts: No new objections. Squash disagreement resolved (no-squash accepted). Consensus reached.
