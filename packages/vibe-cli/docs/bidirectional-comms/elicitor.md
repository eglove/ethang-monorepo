# Elicitor Session — Bidirectional Agent Communications

**Date:** 2026-04-17
**Status:** COMPLETE
**Feature:** bidirectional-comms

---

## Purpose

Replace the stateless fire-and-forget `Invoke-Claude` invocation pattern with persistent Claude agent processes coordinated by a PowerShell event bus backed by SQLite. Today the pipeline runs 50–100+ separate CLI sessions per feature, almost all starting cold — the single largest source of wasted tokens and degraded agent reasoning. With persistent sessions, writers preserve design rationale across debate rounds, debate moderators track open/resolved objections, fix-loop workers remember what they already tried, and reviewers see diffs in continuity. Git diffs become the primary inter-agent communication medium, letting every agent stay "warm" for new input while the SQLite event log carries the facts.

## Artifact / Output Type

A new `bus/` subsystem inside `packages/vibe-cli/`, plus new SQLite tables (`agent_sessions`, `event_log`), plus rewritten Stages 2–7, plus deletion of several obsolete utilities, plus a full three-tier test suite. This is not a library that ships independently — it is a rewrite of the pipeline's communication layer, end-to-end, with every current non-interactive `Invoke-Claude` call site migrated.

## Trigger

Unchanged from today: `./vibe.ps1 "<seed>"` starts a fresh pipeline, `./vibe.ps1 -Resume` resumes a halted one. New convenience: `./vibe.ps1 -Status` (or equivalent `Get-BusStatus` cmdlet) prints current bus state for ad-hoc inspection.

## Inputs

- Seed prompt (first run) or existing SQLite state (resume).
- Existing worktree per feature, existing warden configuration, existing model routing config (`config/model-routing.psd1`).
- Agent system prompt templates in `bus/agents/<role>.ps1` (generated dynamically at spawn time from role-static content + filtered event-type catalog + routing rules this role is subject to).
- Per-agent `bootstrap` event payload: `{feature_name, target_root, working_tree, inputs{}, outputs{}, peer_agents[], initial_directive}` — paths only, never file contents.

## Outputs

- A running pipeline whose Stages 2–7 communicate entirely via the bus.
- A `event_log` SQLite table containing the complete append-only record of inter-agent messages, with `evt_id`, `from`, `to`, `in_reply_to`, `group_id`, `type`, payload JSON, and status — sufficient to reconstruct any conversation graph and to drive crash-recovery via `-Resume`.
- A `agent_sessions` SQLite table with one row per live/dead agent instance: `session_id`, `feature_name`, `role`, `instance_name`, `pid`, `status`, `group_id`, `checkpoint_json`, `started_at`, `ended_at`.
- Feature-branch git history with one commit per agent `done` event, each commit message carrying `Vibe-Event-Id` / `Vibe-Group-Id` trailers.
- A live heartbeat banner emitted every 10 seconds to both terminal and `pipeline-log.ps1`, UTF-8 box format, showing live agents with color-coded idle time.
- At feature completion, the same observable output as today's pipeline (feature branch ready for PR), produced by a fundamentally different communication substrate.

## Ecosystem Placement

Chained. This feature is the communication layer beneath every downstream pipeline stage. Stage 1 (elicitor) sits upstream and stays stateless/TTY-interactive — the human is the peer, not the bus. Stages 2–7 all migrate to the bus. External systems (TLC, test runners, git) are bus *handlers* (synchronous PowerShell dispatch), not processes — they appear on the bus as reserved `to` names (`tlc`, `tests`, `git`).

## Handoff

Downstream of this elicitor session, the design pipeline (grill-me → architect → TLA+ → BDD → debates → implementation → coding) takes `elicitor.md` and drives the rest of the work. Stage scope inside this feature is bounded by `packages/vibe-cli/` only; the user has explicitly approved that downstream debate rounds may surface additional sub-requirements as long as they stay within that directory.

## Error States

Three and only three halt conditions:

1. **Semantic termination.** `consensus_ratified`, `consensus_failed` (with reason), or feature completion. Normal exit.
2. **Mechanical / logical error.** Infrastructure failures — git commit failure outside Stage 7's expected merge-queue domain, SQLite errors, handler-binary crashes, agent process exit, group invariant violations, duplicate `evt_id`. The router halts, tears down all agents via `Stop-ProcessTree`, writes final state to SQLite, exits non-zero. Human re-engages via `-Resume`, which is treated as a continuation (not a retry).
3. **User interrupt.** Ctrl+C (existing double-Ctrl+C handler retained). Same teardown path as mechanical error.

**Agent protocol violations (malformed JSON, schema failure, disallowed event type, wrong target) are NOT halts.** The router emits a `protocol_error` event back to the offending agent; the agent self-corrects on its next turn. Logged but non-terminal. This is "recover" at the protocol level — distinct from "retry" because the agent is alive and correcting itself, not being restarted.

**No timeouts. No retry caps. No budget caps. No round caps.** The only ceilings in the system are the three above plus the real external constraint of the Claude API context window (handled by context-aware session renewal, see Edge Cases).

## Name

- Subsystem: **`Bus`**. Lives at `packages/vibe-cli/bus/`.
- Layout:
  - `bus/router/` — routing, validation, event-log append, group tracking, heartbeat runspace
  - `bus/event-types/` — one `.psd1` + JSON schema per event type (closed enum)
  - `bus/agents/` — one file per agent role: system prompt template, lifetime rule, allowed event types
  - `bus/handlers/` — `tlc-handler.ps1`, `tests-handler.ps1`, `git-handler.ps1`
  - `tests/bus/` — unit tests per file
  - `tests/bus/integration/` — in-memory SQLite + mocked CLI/git
  - `tests/bus/e2e/` — on-disk SQLite (deleted on teardown) + mocked CLI/git
  - `tests/bus/properties/` — property-based tests
  - `tests/bus/traces/` — trace-replay tests
- Public functions: `Start-BusAgent`, `Stop-BusAgent`, `Send-BusEvent`, `Wait-BusGroup`, `Register-BusHandler`, `Get-BusStatus`, `Stop-AllBusAgents`.
- Event envelope: `{evt_id, from, to, in_reply_to, type, payload, group_id?}`.
- Event type names (closed enum, `snake_case`): `bootstrap`, `ground_truth`, `done`, `objection`, `objection_response`, `consensus_candidate`, `consensus_ratified`, `consensus_failed`, `verify`, `verify_result`, `review_requested`, `review_verdict`, `checkpoint`, `checkpoint_response`, `protocol_error`.
- New SQLite tables: `agent_sessions`, `event_log` (with `checkpoint_json` column on `agent_sessions`).
- Deleted SQLite tables: `debate_state`, `stage_outputs`, `tier_progress` (data now in `event_log`).

## Scope

**IN scope:**

- Every currently-stateless `Invoke-Claude` call site in Stages 2–7 is migrated to the bus.
- New `bus/` subsystem with router, event-type registry, agent spawn definitions, native-tool handlers.
- New SQLite tables `agent_sessions` and `event_log`; deletion and in-feature migration away from `debate_state`, `stage_outputs`, `tier_progress`.
- Persistent agent processes via `[System.Diagnostics.Process]::Start()` with `--print --verbose --input-format stream-json --output-format stream-json`. One stdout-reader runspace per agent feeding PowerShell engine events.
- Addressed envelopes with correlation IDs: `{evt_id, from, to, in_reply_to, type, payload, group_id?}`.
- Closed-enum event types with per-type JSON schema validation of `payload`. Routing rules constrain `(sender_role, type) → target`; when the target is determined by type, the agent omits `to` and the router infers it. Disallowed combinations rejected via `protocol_error`.
- Fan-out via `group_id`: router holds responses until all group members reply, then emits aggregated event (Stage 2 parallel writers, Stage 7 per-task reviewers).
- Agent lifetimes (logical-scope):
  - Writers (TLA, BDD): Stage 2 start → Stage 3 consensus.
  - Debate moderators: per-debate.
  - Coding workers: per-task (dispatch → merge).
  - Reviewers: **per-task** (not per-feature — bounded to avoid context exhaustion).
- Git diffs as primary inter-agent payload. One commit per `done` event, mutex-serialized per worktree, auto-generated message with `Vibe-Event-Id` trailer. Hard-fail on unexpected file-path overlap between parallel writers. Stage 7's existing merge-queue path continues to own cross-task integration conflicts.
- Hybrid consensus: moderator emits `consensus_candidate`, PowerShell independently checks event-log for unresolved objections, emits `consensus_ratified` iff both agree; if not, replies with unresolved `evt_id`s and the moderator either resolves or explicitly overrides.
- Native tools (`tlc`, `tests`, `git`) as bus handlers (synchronous PowerShell dispatch, no processes). Agents address them as peers.
- Hybrid ground-truth injection: every outbound message from PS to an agent prepends a role-specific structured `ground_truth` block derived from SQLite. Healthy agents reconcile each turn; crashed agents re-bootstrap via the same path on `-Resume`.
- Context-aware session renewal (checkpointing): router watches `result.usage.total_tokens`; at ~80% of model context window, emits `checkpoint`, stores response in `agent_sessions.checkpoint_json`, tears down process, spawns fresh with bootstrap + ground-truth + checkpoint as first three events. New event types `checkpoint` / `checkpoint_response`. Framed as a graceful handoff, not a retry — consistent with "no arbitrary limits" because the trigger is a real external API constraint.
- Observability:
  - Event-level `Write-PipelineLog` entry per routed event (replaces per-agent INVOKE/COMPLETE lines).
  - 10-second heartbeat banner: UTF-8 box format, printed atomically (mutex) to terminal and log, color-coded idle time (yellow >1m, red >5m). Blank line above and below. Compact grouping by task during Stage 7.
  - `vibe -Status` / `Get-BusStatus` for ad-hoc SQLite-backed inspection.
- Ctrl+C teardown: `Stop-AllBusAgents` iterates `agent_sessions WHERE status='alive'` and calls `Stop-ProcessTree` on each PID. Existing double-Ctrl+C handler in `vibe.ps1` retained.
- `-Resume` crash-recovery path: on resume, router queries `agent_sessions WHERE status='ended'`, reconstructs which logical-scope agents should be alive based on `stage_progress` + `pipeline_state`, spawns fresh processes, delivers `bootstrap` + `ground_truth` + latest `checkpoint` (if any) derived from SQLite.
- System prompts generated at spawn time from static role content + filtered event-type catalog + routing rules; written to a temp file per agent spawn and passed via `--system-prompt-file`.
- Utility changes:
  - **Kept:** `Invoke-Claude` only for `-Interactive` (Stage 1 elicitor). `job-runner.ps1`'s `Stop-ProcessTree`.
  - **Deleted:** `utils/invoke-parallel.ps1`, `utils/unified-debate-loop.ps1`, `utils/debate-loop.ps1`, `utils/invoke-verify.ps1`, rest of `utils/job-runner.ps1` (output-pollution guard salvaged into the commit serializer if needed).
- Test doubles:
  - Extended `tests/helpers/claude-test-double.ps1` to accept and emit stream-json (NDJSON) on stdin/stdout.
  - New `tests/helpers/git-test-double.ps1` speaking the git subset the bus uses (`add`, `commit`, `diff --cached`, `show`, `log`) with in-memory simulated tree.

**OUT of scope:**

- Stage 1 (elicitor). Remains stateless and TTY-interactive. The human is the peer, not the bus.
- Merge queue and conflict resolution in Stage 7. Existing `merge-queue.Tests.ps1` and `merge_results` table remain authoritative for cross-task integration.
- Worktree management, `Get-PackageWorkDir`, warden configuration, warden gating.
- Model routing config (`config/model-routing.psd1`) — used as-is at spawn time.
- Existing SQLite tables that don't need to change: `features`, `stage_progress`, `pipeline_lock`, `artifacts`, `pipeline_state`, `task_results`, `merge_results`, `gate_results`, `session`.
- Pre-pipeline planning utilities: `validate-plan.ps1`, `ratchet-coverage.ps1`, `resolve-target-root.ps1`, `resolve-pipeline-state.ps1`.
- Knowledge-graph subsystem.
- Stage catalog — stays 7 stages.
- Targeted per-reviewer diffs (considered, declined — not realistic).
- Any change to the public user-facing `vibe.ps1` interface except the added `-Status` flag.

## Edge Cases

- **Malformed JSON / envelope-validation failure / payload-schema failure:** router emits `protocol_error` event back to sender with the validation error; agent self-corrects on next turn. Non-terminal. Logged.
- **Agent emits disallowed event type or target:** same as above — `protocol_error` recovery.
- **Agent process exits unexpectedly (crash, OOM, CLI bug, parent-pipe closed):** treated as mechanical error — halt, preserve SQLite state, surface to human. Human uses `-Resume` to re-spawn from ground-truth + checkpoint.
- **Git commit failure outside Stage 7:** mechanical error — halt.
- **Git conflict inside Stage 7 between parallel task branches:** handled by existing merge queue, not the bus.
- **Git conflict outside Stage 7 (parallel writers touching same file):** mechanical error — halt. Parallel writers must edit disjoint paths.
- **`.git/index.lock` contention:** resolved by per-worktree `[System.Threading.Mutex]` in the commit serializer. One commit at a time per worktree.
- **SQLite error (locked DB, corruption, constraint violation):** mechanical error — halt.
- **Handler failure (TLC binary missing, tests crash the shell, unknown `to` target):** mechanical error — halt.
- **Group invariant violation (duplicate response, non-member response, etc.):** mechanical error — halt. These should never fire in correct code; treated as a bug.
- **Duplicate `evt_id`:** mechanical error — halt. Router should allocate IDs monotonically, but if this fires, halt.
- **Agent context window approaching limit:** session renewal via `checkpoint` / `checkpoint_response` handoff (see IN scope). Not a halt.
- **Stdout reader stream contention (e.g., concurrent `ReadLineAsync`):** avoided by the documented pattern — one dedicated runspace per agent's stdout stream, using blocking `ReadLine` into a `ConcurrentQueue`; engine events fire from the orchestrator thread after dequeue.
- **Log-output interleaving (heartbeat banner torn apart by concurrent event-log writes):** avoided by a dedicated `Write-PipelineLog` mutex that serializes access to `[Console]::Out` and the log file for multi-line writes.
- **Stuck agent (alive but making no progress, no `result` in long time):** observable via heartbeat banner's idle-time column (yellow at >1m, red at >5m). No automatic kill. Human decides whether to Ctrl+C.
- **Test isolation:** integration tier uses in-memory SQLite, e2e tier uses on-disk SQLite deleted at teardown, all tiers mock both Claude CLI and git. No real external binaries in any test.

## Notes

- All features MUST be complete and fully wired up to the rest of the program. No partial implementations or dead code paths.
- Every feature MUST include unit tests, integration tests, and end-to-end (e2e) tests.
- The final task for this feature is to review completeness: verify all e2e and integration tests pass, and confirm the feature is fully wired into the application.

---

# User Seed (Everything Above Supersedes the Below)

Replace the current stateless fire-and-forget invocation pattern with persistent
agent sessions using Claude CLI's `--input-format stream-json` and
`--output-format stream-json` capabilities. Today every `Invoke-Claude` call
spins up a fresh process with zero memory of prior calls. The pipeline runs
50-100+ separate sessions per feature, and almost every one starts cold. This is
the single biggest source of wasted tokens and degraded agent reasoning in the
pipeline.

## Prerequisite: SQLite State (Backlog #1) — In Flight

The SQLite refactor is already underway. This feature builds on top of it. With
centralized state in SQLite, the event-driven system gains:

- **Agent session registry.** SQLite stores `{ stage, agent_name, pid, status }`
  so the orchestrator knows which agents are alive and the pipeline can recover
  from crashes by inspecting what was running.
- **Lean agent bootstrapping.** Instead of stuffing all context into a prompt,
  PowerShell queries SQLite for the relevant state slice and sends a compact
  JSON message on stdin. The agent's conversation history carries the reasoning;
  SQLite carries the facts.
- **Event persistence.** Every message sent to or received from an agent is
  logged in SQLite. If an agent process dies, the orchestrator starts a new one
  and replays pending messages from the event log.
- **Debate state offloading.** Round count, open objections, resolved items, and
  consensus status live in SQLite. The moderator gets a summary injected from
  the DB each round instead of carrying full history in its context window. This
  prevents token cost from scaling linearly with debate length.
- **Ground truth correction.** Long-lived agents can accumulate stale beliefs
  (e.g., "the test passed" when a later stage re-ran it and it failed). The
  orchestrator queries SQLite for current state before each message and injects
  corrections. SQLite is the source of truth; session memory is the reasoning
  layer.

## Core Idea

PowerShell becomes an event-driven orchestrator hosting long-lived Claude agent
processes. Each agent is started once with `--input-format stream-json
--output-format stream-json` and stays alive for the duration of its logical
scope (a debate, a stage, or the entire pipeline). PowerShell sends
`user_message` JSON objects on stdin, reads `assistant`/`result` events from
stdout, and routes messages between agents or dispatches native tools (TLC,
tests, git) in response to agent signals. SQLite is the shared state backbone.

```
┌───────────────────────────────────────────────────┐
│              PowerShell Event Bus                  │
│    Register-EngineEvent + Runspace readers         │
│    SQLite: event_log, agent_sessions, state        │
├──────────┬──────────┬──────────┬─────────────────┤
│          │          │          │                   │
▼          ▼          ▼          ▼                   ▼
┌────────┐┌────────┐┌────────┐┌──────────┐ ┌──────────┐
│ TLA    ││ BDD    ││ Debate ││ Review   │ │ TLC/Test │
│ Writer ││ Writer ││ Mod.   ││ Mod.     │ │ Runners  │
│ stdin↔ ││ stdin↔ ││ stdin↔ ││ stdin↔   │ │ (native) │
│ stdout ││ stdout ││ stdout ││ stdout   │ │          │
└────────┘└────────┘└────────┘└──────────┘ └──────────┘
  long-lived claude processes (stream-json)
```

## Verified Protocol

Tested and confirmed working on Claude CLI 2.1.96 (Windows). The `--print` flag
is required — `--input-format stream-json` only works with `--print`. Despite
the `--print` help text saying "print response and exit", when combined with
stream-json input the process stays alive as long as stdin remains open. This
has been empirically verified with multi-turn conversations.

### Agent Lifecycle

An agent is a `claude` process started with bidirectional JSON streaming. Use
`[System.Diagnostics.Process]::Start()` instead of `Start-Process` for direct
access to stdin/stdout streams:

```powershell
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = 'claude'
$psi.Arguments = '--print --verbose --input-format stream-json --output-format stream-json --system-prompt-file agents/tla-writer.md --dangerously-skip-permissions'
$psi.UseShellExecute = $false
$psi.RedirectStandardInput = $true
$psi.RedirectStandardOutput = $true
$psi.RedirectStandardError = $true
$psi.CreateNoWindow = $true

$proc = [System.Diagnostics.Process]::Start($psi)
```

The process stays alive. PowerShell holds `$proc.StandardInput` (write) and
`$proc.StandardOutput` (read). A dedicated runspace reads stdout continuously
and fires PowerShell engine events for each JSON line. The agent is registered
in SQLite's `agent_sessions` table with its PID and status.

### Message Format

The input format is NDJSON (one JSON object per line). The correct schema for
sending a user message:

```json
{"type":"user","message":{"role":"user","content":"your prompt here"}}
```

To send a message to an agent:

```powershell
$msg = @{
    type = "user"
    message = @{ role = "user"; content = $payload }
} | ConvertTo-Json -Compress
$proc.StandardInput.WriteLine($msg)
$proc.StandardInput.Flush()
```

### Output Events

The process emits NDJSON on stdout. Key event types in order:

1. `system/init` — session metadata (tools, model, session_id)
2. `system/hook_started` + `system/hook_response` — if hooks are configured
3. `assistant` — agent response with `message.content[]` blocks (text, tool_use)
4. `result` — **signals turn completion**. Contains `result` text, `total_cost_usd`,
   `duration_ms`. This is the flow control signal — wait for this before sending
   the next message.

### Stdout Reader Pattern

Use a dedicated runspace to avoid stream contention. Do not call ReadLineAsync
in a polling loop — it throws if a prior read is still pending.

```powershell
$outputBag = [System.Collections.Concurrent.ConcurrentQueue[string]]::new()
$runspace = [runspacefactory]::CreateRunspace()
$runspace.Open()
$ps = [powershell]::Create().AddScript({
    param($reader, $bag)
    while ($null -ne ($line = $reader.ReadLine())) { $bag.Enqueue($line) }
}).AddArgument($proc.StandardOutput).AddArgument($outputBag)
$ps.Runspace = $runspace
$handle = $ps.BeginInvoke()
```

The orchestrator drains the queue and fires engine events:

```powershell
Register-EngineEvent -SourceIdentifier "Agent:$agentName" -Action {
    $evt = $Event.MessageData
    if ($evt.type -eq 'result') {
        New-Event -SourceIdentifier "Orchestrator:ResultReady" -MessageData @{
            Agent = $Event.SourceIdentifier
            Result = $evt
        }
    }
}
```

### Orchestration Patterns

**Debate loop:** Moderator and revisers are all live processes. The orchestrator
sends the moderator a message, waits for its `result` event, extracts
objections, and routes them to the appropriate reviser's stdin. The reviser
responds, the orchestrator sends the updated artifact back to the moderator.
No session is created or destroyed — the same processes handle all rounds.

**TLC verification:** The TLA writer is a live process. It writes a spec, sends
a signal (via structured output or a convention like `"ready_for_tlc": true`).
The orchestrator runs TLC natively, captures the result, and sends it back to
the writer's stdin. The writer fixes inline with full memory of its design
rationale.

**Cross-stage handoff:** The TLA writer started in Stage 2 stays alive into
Stage 3. When the debate moderator raises an objection about the TLA spec, the
orchestrator routes it to the already-running writer process. No new session, no
lost context.

### Flow Control

The orchestrator needs to know when an agent has finished a turn. The `result`
event in stream-json output signals turn completion. The orchestrator waits for
this event before sending the next message. The `--replay-user-messages` flag
can echo inputs back for correlation if needed.

## Where This Matters Most (by impact)

### Debate Loops (Stages 3 and 6) — highest value

Today the debate moderator forgets prior rounds. Each round is a fresh session
that re-reads all artifacts and may raise the same objections it raised last
round. With a persistent process, the moderator tracks what was objected to,
what was fixed, and what remains. Revisers remember their reasoning and make
targeted fixes instead of starting from scratch.

SQLite integration: debate state (round number, objections, resolutions) is
written to SQLite after each round. If a process crashes and must be restarted,
the orchestrator injects a state summary from SQLite so the replacement agent
can pick up where the previous one left off.

### TLA Writer + TLC Verification Loop (Stage 2)

The original motivating case. Writer produces a spec, TLC fails, writer gets
error output but has no memory of its design rationale. With a persistent
process, the writer says "I chose that invariant because of constraint X, the
real fix is Y" instead of guessing.

### Double-Pass Fix Loops (Stage 7b, 7d)

Each fix attempt only sees the test error. No memory of what was already tried.
With a persistent process: "I already tried null checks on line 42 and that
didn't fix it. The root cause must be upstream."

SQLite integration: fix attempts and their outcomes are logged. If the process
is lost, the replacement gets a summary of all prior attempts.

### Review Loops (Stage 7c, 7e)

Reviewer sees the diff cold each time. With a persistent process: "Last review
I flagged the missing error boundary. They added it but introduced a type
mismatch."

### Cross-Stage Writer Continuity

The TLA writer process from Stage 2 survives into Stage 3's debate. When the
moderator objects, the objection routes to the same process that produced the
spec, preserving full design rationale. SQLite's `agent_sessions` table tracks
which processes are alive and which agent they represent.

## PowerShell Primitives

- `Start-Process -RedirectStandardInput/Output` for pipe access to agent stdin/
  stdout
- `Register-EngineEvent` / `New-Event` for the event bus
- Runspaces for concurrent stdout readers (one per agent)
- SQLite `agent_sessions` and `event_log` tables for durability and crash
  recovery
- `--max-budget-usd` per agent process for cost guardrails

## Trade-offs

- **Token cost:** Long-lived sessions accumulate conversation history. Round 10
  of a debate includes all prior rounds in context. Mitigated by offloading
  structured state to SQLite and sending compact summaries rather than full
  artifact contents on each turn.
- **Process management:** Long-lived processes can crash, hang, or hit memory
  limits. SQLite's event log enables replay on restart. The orchestrator needs
  health checks and timeout logic (already partially built in job-runner.ps1).
- **Complexity:** Managing concurrent stdin/stdout streams across multiple
  processes requires careful runspace management. Prototype as an isolated
  `AgentHost` utility before wiring into the full pipeline.

## Suggested Implementation Order

Since SQLite state is already in flight, this work assumes the state DB,
repository pattern, and query infrastructure already exist.

1. Add `agent_sessions` table to SQLite schema (feature, agent_name, pid,
   status, created_at, budget_spent)
2. Add `event_log` table (timestamp, source_agent, target_agent, direction,
   payload_hash, payload)
3. Build `AgentHost` utility: starts a claude process with stream-json, manages
   stdin/stdout, fires engine events, registers in SQLite
4. Build orchestrator loop: waits for result events, routes messages between
   agents, dispatches native tool runs
5. Retrofit debate loops to use AgentHost — moderator and revisers as persistent
   processes
6. Retrofit TLC verification loop — TLA writer as persistent process with
   orchestrator running TLC between turns
7. Retrofit double-pass and review loops
8. Enable cross-stage process handoff — agents survive stage boundaries
