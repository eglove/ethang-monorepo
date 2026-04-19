# Stage Event Cascade Order

## Stage 2 — Parallel Writers

1. `stage_started` (sent by Invoke-ParallelWriter, role: pipeline)
2. `agent_started` (bdd-writer agent, sent by Start-BusAgent)
3. `agent_started` (tla-writer agent, sent by Start-BusAgent)
4. `verify` (bdd-writer → bus, on file output)
5. `verify` (tla-writer → bus, on file output)
6. `stage_completed` (sent by Invoke-ParallelWriter, role: pipeline)

## Stage 3 — Unified Debate

1. `stage_started` (sent by Invoke-UnifiedDebateStage, role: pipeline)
2. `agent_started` (unified-moderator agent, sent by Start-BusAgent)
3. `verify` (moderator → bus, per debate round)
4. `consensus_candidate` (moderator → bus, when CONSENSUS_REACHED)
5. `stage_completed` (sent by Invoke-UnifiedDebateStage, role: pipeline)

## Stage 4 — Post-Debate Artifacts

1. `stage_started` (sent by Invoke-PostDebate, role: pipeline)
2. `verify` (sent by Invoke-PostDebate after fixture generation, artifact: bdd-fixture)
3. `stage_completed` (sent by Invoke-PostDebate, role: pipeline)

Note: Stage 4 is synchronous — no agents are dispatched. Bus events provide observability only.

## Stage 6 — Implementation Debate

1. `stage_started` (sent by Invoke-ImplementationDebateStage, role: pipeline)
2. `agent_started` (impl-debate-mod agent, sent by Start-BusAgent)
3. `consensus_candidate` (moderator → bus, when consensus reached)
4. `consensus_ratify` or `consensus_fail` (bus → moderator, outcome)
5. `stage_completed` (sent by Invoke-ImplementationDebateStage, role: pipeline)

## Stage 7 — Coding Stage
1. `stage_started` (sent by Invoke-CodingStage, role: pipeline)
2. `verify` (gate: fixture_coverage — after fixture coverage check)
3. `verify` (gate: pre_coding — before tier dispatch)
4. `verify` (gate: per_worktree — after per-worktree gates pass)
5. `checkpoint` (phase: post_merge — after sequential merge)
6. `verify` (gate: global_doublepass — after global double-pass)
7. `verify` (gate: global_review — after global review)
8. `stage_completed` (sent by Invoke-CodingStage, role: pipeline)

Note: Stage 7 is the host stage for the bus. Bus events wrap existing milestone
markers — the underlying orchestration (git, worktrees, gates) is unchanged.
