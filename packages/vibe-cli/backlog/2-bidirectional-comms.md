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
