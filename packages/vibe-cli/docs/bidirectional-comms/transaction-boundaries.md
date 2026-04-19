# Transaction Boundaries

Documents the BEGIN IMMEDIATE transaction scope for each aggregate.

## Stage 2 — Parallel Writers Aggregate

**Transaction scope**: Per-agent output write
- BEGIN IMMEDIATE when writing bdd-writer or tla-writer output to SQLite
- Committed after verify event is published to bus
- Rolled back on agent failure before verify

## Stage 3 — Unified Debate Aggregate

**Transaction scope**: Per-debate-round consensus update
- BEGIN IMMEDIATE when writing consensus_candidate to bus state
- Committed after moderator receives consensus_ratify
- Rolled back on consensus_fail

## Stage 4 — Post-Debate Artifacts Aggregate

**Transaction scope**: Fixture generation
- BEGIN IMMEDIATE when writing bdd-fixture to SQLite
- Committed after verify event published
- No agents dispatched; single synchronous transaction

## Stage 5 — Implementation Writer Aggregate

**Transaction scope**: Implementation plan write
- BEGIN IMMEDIATE when writing implementation-plan.json
- Committed after successful file write
- Rolled back on write error

## Stage 6 — Implementation Debate Aggregate

**Transaction scope**: Per-round implementation consensus
- BEGIN IMMEDIATE when writing impl consensus_candidate
- Committed after consensus_ratify from bus
- Rolled back on consensus_fail

## Stage 7 — Coding Stage Aggregate

**Transaction scope**: Per-worktree gate checkpoint
- BEGIN IMMEDIATE at each checkpoint (post_merge phase)
- Committed after global double-pass gate passes
- Rolled back on any gate failure during global_review
- Git stash operations are not part of SQLite transaction (separate atomic unit)
