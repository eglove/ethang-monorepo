# Stage Event Cascade Order

## Stage 2 — Parallel Writers

1. `stage_started` (sent by Invoke-ParallelWriter, role: pipeline)
2. `agent_started` (bdd-writer agent, sent by Start-BusAgent)
3. `agent_started` (tla-writer agent, sent by Start-BusAgent)
4. `verify` (bdd-writer → bus, on file output)
5. `verify` (tla-writer → bus, on file output)
6. `stage_completed` (sent by Invoke-ParallelWriter, role: pipeline)
