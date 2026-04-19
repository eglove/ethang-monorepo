# BDD Scenarios — Bidirectional Agent Communications (Bus)
# Date: 2026-04-18
# Source: docs/bidirectional-comms/elicitor.md
# Revised: debate objections addressed, v11 TLA+ alignment (unified-debate.md 2026-04-18)
# TLA+ version: v11 (BidirectionalComms.tla, BidirectionalComms.cfg — 21 INVARIANT, 5 PROPERTY)
#   v11 changes: OBJ-EC-3 resets ConsensusRound in RouterHaltsRollbackSqliteError;
#   OBJ-A adds consensusRoundStart epoch; OBJ-C adds RouterAbortsStaleRollback + WF fairness.
#
# Tag taxonomy:
#   @primary           — happy-path scenario a stakeholder can verify against the running system
#   @negative          — error input, rejection, or failure response
#   @edge_case         — unusual or low-probability condition that must be handled correctly
#   @data_driven       — Scenario Outline; Examples table drives coverage
#   @integration       — cross-component behavior requiring more than one subsystem
#   @quality_attribute — non-functional requirement: performance, observability, operability
#   @failure_recovery  — crash recovery, resume, or partial-failure handling
#   @boundary          — condition at a type or domain boundary (integer limits, size caps, empty collections)
#
# Glossary — Ubiquitous Language
#   Bus                      — the PowerShell event bus subsystem at bus/; replaces all stateless Invoke-Claude call sites in Stages 2–7
#   Agent                    — a long-lived `claude` process started with bidirectional stream-json; stays alive for its logical scope
#   AgentLifecycle           — the cross-checkpoint identity of an agent role; persists across session renewals with the same feature_name + role + instance_name
#   Agent session            — one row in agent_sessions: session_id, feature_name, role, instance_name, pid, status, group_id, checkpoint_json, started_at, ended_at
#                              status ∈ {alive, ended, crashed}
#                              alive   — process is running and healthy
#                              crashed — transient intermediate state: OS reports PID absent but row has not yet been reconciled by -Resume; becomes ended after reconciliation
#                              ended   — process was stopped cleanly (Stop-BusAgent) or crash-reconciled; ended_at is set
#   All timestamps stored as UTC (ISO 8601); never local time — DST transitions and NTP jumps must not affect calculations
#   Event                    — a JSON envelope routed through the bus: {evt_id, from, to, in_reply_to, type, payload, group_id?}
#   eventLog                 — TLA+ variable name (v5+) for the set of delivered event records; implemented as the event_log SQLite table; the former variable name "Deliveries" (used in v4) is retired — no reference to "Deliveries" should appear in this document or in implementation code
#   Event log                — append-only SQLite table event_log; the authoritative durable record of every inter-agent message
#   Event type               — one of the 16 closed-enum values: bootstrap, ground_truth, done, objection, objection_response, consensus_candidate, consensus_ratified, consensus_failed, verify, verify_result, review_requested, review_verdict, checkpoint, checkpoint_response, protocol_error, protocol_error_ack
#   ConsensusEventType       — named subset (TLA+ v10): objection, objection_response, consensus_candidate, consensus_ratified, consensus_failed; these events are never addressed to native handlers and consensus_ratified is always from="router"
#   ProtocolBookkeepingEventType — named subset (TLA+ v10): protocol_error, protocol_error_ack; both are router↔agent infrastructure types, not consensus or domain events
#   DomainEventType          — named subset (TLA+ v10): all EventTypes except ConsensusEventTypes and ProtocolBookkeepingEventTypes; i.e., bootstrap, ground_truth, done, verify, verify_result, review_requested, review_verdict, checkpoint, checkpoint_response
#   Note: ConsensusEventType, ProtocolBookkeepingEventType, and DomainEventType together partition the 16-value closed enum; the distinction is enforced by the router via routing rules (ConsensusEventsRoutedThroughBus invariant) and is no longer merely conceptual
#   Envelope                 — the outer JSON wrapper: {evt_id, from, to, in_reply_to, type, payload, group_id?}
#   Router                   — the PowerShell component in bus/router/ that validates envelopes, appends to event_log, and dispatches to agents or handlers
#   Handler                  — a synchronous PowerShell dispatch in bus/handlers/ for native tools
#   HandlerAdapter           — the anti-corruption layer in bus/handlers/ that translates bus envelopes into native tool invocations (tlc, tests, git) and translates results back into verify_result envelopes
#   Handler target           — a reserved to-name on the bus: "tlc", "tests", "git"; these are not agent processes
#   Group                    — the aggregate of agents sharing a group_id; the router holds responses until all members reply; tracked in memory by Wait-BusGroup
#   Fan-out                  — sending one event to multiple agents sharing a group_id; resolved when all members reply
#   Start-BusAgent           — public function: spawns a claude process, registers it in agent_sessions, starts a stdout-reader runspace
#   Stop-BusAgent            — public function: tears down a single agent process and marks its agent_sessions row ended
#   Send-BusEvent            — public function: constructs and routes an envelope to one agent or handler
#   Wait-BusGroup            — public function: blocks until all members of a group_id have replied
#   Register-BusHandler      — public function: registers a synchronous PowerShell scriptblock for a named handler target
#   Get-BusStatus            — public function: queries agent_sessions and event_log and prints current bus state including health metrics
#   Stop-AllBusAgents        — public function: iterates agent_sessions WHERE status='alive', calls Stop-ProcessTree on each PID
#   Bootstrap event          — the first event sent to a newly spawned agent: {feature_name, target_root, working_tree, inputs{}, outputs{}, peer_agents[], initial_directive} — paths only, no file contents
#   Ground truth             — a role-specific structured block derived from current SQLite state prepended to every outbound message; corrects stale in-context beliefs; size bounded at ≤8 KB
#   Checkpoint               — a graceful handoff when an agent approaches the model context window limit (~80% of total_tokens); router emits checkpoint event, stores checkpoint_json (≤128 KB), tears down, spawns fresh
#   Protocol error           — a non-terminal violation: malformed envelope, schema failure, disallowed event type/target; router emits protocol_error back to sender; agent corrects by emitting a valid event within one turn
#   Mechanical error         — a terminal halt condition: git commit failure (outside Stage 7), SQLite error, agent process crash, group invariant violation, duplicate evt_id, handler failure
#   Semantic termination     — a terminal halt condition via consensus_ratified, consensus_failed, feature completion, or user_rollback; clean exit, exit code 0
#   User interrupt           — a terminal halt condition via Ctrl+C; same teardown path as mechanical error, exit code 1
#   user_rollback            — a HaltReasons value (added v8, retained v10); user-initiated rollback to a prior snapshot; semantic halt, exit code 0; distinct from mechanical error
#                              rollbackRequested state variable drives RouterExecutesRollback; action is gated on BusRunning (busStatus="running") — rollback cannot execute while halted or resuming
#                              rollbackTargetWorktree (added v9 OBJ-4) identifies the specific worktree being rolled back; cleared after rollback completes or on RouterHaltsRollbackSqliteError
#   rollbackTargetWorktree   — state variable (TLA+ v9 OBJ-4): Worktrees ∪ {NULL}; set when UserRequestsRollback(w) fires; cleared by RouterExecutesRollback and RouterHaltsRollbackSqliteError
#   handlerPendingEpoch      — state variable (TLA+ v9 OBJ-9): [Handlers -> 1..MaxEvtId+1 ∪ {NULL}]; records the spawnedAtEvt of the agent that submitted the handler request; HandlerAdapterCompletes rejects completions where spawnedAtEvt[a] ≠ handlerPendingEpoch[h] (stale-epoch guard)
#   NoOrphanedHandlerForDeadAgent — TLA+ v9 invariant (OBJ-6, cfg line 169): agentStatus[a]="dead" ⇒ ∀ h ∈ Handlers : handlerPendingAgent[h] ≠ a; no handler may remain pending for a dead agent
#   RouterHaltsRollbackSqliteError — TLA+ v9 halt action (OBJ-11), extended v11 OBJ-EC-3: fires when a SQLite error occurs during rollback execution; sets haltReason="mechanical_error", failureCategory="sqlite_error"; clears rollbackRequested and rollbackTargetWorktree; resets ConsensusRound aggregate (consensusState="open", unresolvedObjections=∅, overriddenObjections=∅) and advances consensusRoundStart to nextEvtId (OBJ-A(v11)); exit code 14
#   RouterAbortsStaleRollback — TLA+ v11 action (OBJ-C(v10)): fires when busStatus="halted" and rollbackRequested=TRUE; clears rollbackRequested and rollbackTargetWorktree; preserves snapshot (snapshotExists unchanged) so user may re-issue /rollback after -Resume; does NOT advance consensusRoundStart (no clean-slate epoch — rollback did not execute); guaranteed to fire by WF_vars(RouterAbortsStaleRollback)
#   consensusRoundStart      — TLA+ v11 state variable (OBJ-A(v10)): 1..(MaxEvtId+1); epoch boundary marker for consensus events; advanced to nextEvtId by RouterExecutesRollback and RouterHaltsRollbackSqliteError; NOT advanced by RouterAbortsStaleRollback; ModeratorEmitsCandidate guards use e.evt_id >= consensusRoundStart to exclude pre-rollback events from the immutable eventLog
#   ConsensusRound           — Aggregate Root (TLA+ v9 OBJ-7, amended v11 OBJ-EC-3): the triple (consensusState, unresolvedObjections, overriddenObjections) is reset atomically by RouterExecutesRollback AND by RouterHaltsRollbackSqliteError (v11 OBJ-EC-3); consensusRoundStart is also reset by both actions (v11 OBJ-A); these four fields must always be read and written together as a unit — they are never updated independently; RouterAbortsStaleRollback does NOT reset the ConsensusRound (rollback aborted, no clean-slate boundary)
#   HaltReasons              — complete closed enum (v10): {"consensus_ratified", "consensus_failed", "feature_complete", "mechanical_error", "user_interrupt", "user_rollback"} — six values
#   Logical scope            — the bounded lifetime of an agent role: Writers (Stage 2→3 consensus), Debate moderators (per-debate), Coding workers (per-task dispatch→merge), Reviewers (per-task)
#   Session renewal          — the checkpoint handoff sequence; not a retry — the same AgentLifecycle resumes with full ground truth
#   Heartbeat banner         — a UTF-8 box printed atomically every 10 seconds to terminal and pipeline-log.ps1, color-coded idle time: yellow >1m, red >5m
#   Hybrid consensus         — moderator emits consensus_candidate; PowerShell independently checks event_log for unresolved objections; emits consensus_ratified only if both agree; moderator may explicitly override with enumerated evt_ids
#   Commit serializer        — per-worktree mutex ensuring one commit at a time; one commit per done event; auto-generated message carries Vibe-Event-Id trailer
#   Stdout reader            — one dedicated runspace per agent, using blocking ReadLine into a ConcurrentQueue; orchestrator drains and fires engine events
#   Stream-json              — NDJSON protocol: one JSON object per line on stdin/stdout; result event signals turn completion
#   -Resume                  — vibe.ps1 switch that resumes a halted pipeline; spawns fresh processes from ground_truth + checkpoint stored in SQLite
#   -Status                  — vibe.ps1 flag (or Get-BusStatus cmdlet) for ad-hoc SQLite-backed bus inspection including queue depth and mutex health
#   Invoke-Claude            — retained only for -Interactive (Stage 1 elicitor); all other call sites migrated to the bus
#   Stop-ProcessTree         — utility in job-runner.ps1 retained for tearing down agent process trees
#   Published Language      — a named, versioned contract between two bounded contexts; Bus→Merge-Queue publishes
#                              event_log { type, status='committed', group_id } as the only integration surface;
#                              schema is defined in bus/contracts/bus-merge-queue-contract.json
#   Bounded contexts:
#     Bus          — this subsystem (packages/vibe-cli/bus/); integration point: public functions Start-BusAgent, Send-BusEvent, Wait-BusGroup, Get-BusStatus
#     Elicitor     — Stage 1; stateless, TTY-interactive; integration point: writes SQLite pipeline_state before Stage 2 starts
#     Merge-Queue  — Stage 7 cross-task integration; owns merge_results table; integration point: bus signals readiness via event_log status sentinel
#     Warden       — agent process gating; integration point: must be configured before any Start-BusAgent call (pre-condition, not bus responsibility)
#     Model-Routing — config/model-routing.psd1; read at spawn time; integration point: used by Start-BusAgent to select model per role

# =============================================================================
# Item 1 — Bus Public API Is Operational
# (Revised from implementation-focus: directory paths and file existence)
# Stakeholder-observable: the public functions are available, the bus routes events, and state is durable.
# =============================================================================

Feature: Bus public API is callable and routes events end-to-end
  A stakeholder can start agents, exchange events, and query state without implementation knowledge

  @primary @integration
  Scenario: All seven public bus functions are available and callable without error
    Given the bidirectional-comms feature is fully implemented and loaded
    When each public function is invoked with minimal valid arguments in a clean test environment
    Then Start-BusAgent, Stop-BusAgent, Send-BusEvent, Wait-BusGroup, Register-BusHandler, Get-BusStatus, and Stop-AllBusAgents each complete without throwing a command-not-found error

  @primary @integration
  Scenario: The bus accepts an event, persists it to event_log, and delivers it to the target agent
    Given a bus instance is initialized with an in-memory SQLite database
    And Start-BusAgent has spawned agent "tla-writer" with role "tla-writer"
    When Send-BusEvent is called with from="orchestrator", to="tla-writer", type="bootstrap", and a valid bootstrap payload
    Then the event appears in event_log with a non-null evt_id and status="routed"
    And "tla-writer"'s stdin receives a JSON line whose "type" field equals "bootstrap"
    And the delivery is durable: a second bus process reading the same SQLite database can query the event_log row

  @primary @integration
  Scenario: Get-BusStatus returns a non-empty summary when at least one agent is alive
    Given Start-BusAgent has spawned agent "debate-moderator" for feature "auth-flow"
    When Get-BusStatus is called
    Then the output contains "debate-moderator" with status="alive"
    And the output includes at least one event_log row count grouped by type

  @primary @integration
  Scenario: Stop-AllBusAgents leaves zero alive agents and the pipeline exits cleanly
    Given Start-BusAgent spawned "tla-writer" and "bdd-writer"
    And both agents are alive in agent_sessions
    When Stop-AllBusAgents is called
    Then agent_sessions has zero rows with status="alive"
    And the overall process exits without error

# =============================================================================
# Item 2 — Agent Spawn Produces a Warm Persistent Session
# (Revised from implementation-focus: CLI flag strings, ProcessStartInfo properties)
# Stakeholder-observable: session registered, bootstrap delivered, multi-turn conversation works.
# =============================================================================

Feature: Start-BusAgent produces a persistent agent capable of multi-turn conversation
  The spawned agent stays alive, receives events on stdin, and emits turn-complete signals on stdout

  @primary @integration
  Scenario: Start-BusAgent registers the agent in agent_sessions with status alive
    Given Start-BusAgent is called for role "tla-writer" and feature "auth-flow"
    When the function returns
    Then agent_sessions contains exactly one row with role="tla-writer", feature_name="auth-flow", status="alive"
    And the row has a non-null pid and a non-null started_at timestamp
    And the returned session_id matches the agent_sessions row

  @primary @integration
  Scenario: Start-BusAgent delivers the bootstrap event as the agent's first stdin message
    Given Start-BusAgent is called for role "bdd-writer" and feature "auth-flow"
    And the bootstrap payload contains feature_name, target_root, working_tree, inputs{}, outputs{}, peer_agents[], initial_directive
    When the agent's stdin is observed after spawn
    Then the first JSON line written to stdin has type="bootstrap"
    And the bootstrap payload contains only paths, not file contents
    And event_log records a bootstrap event with from="orchestrator", to="bdd-writer", status="routed"

  @primary @integration
  Scenario: An agent spawned by Start-BusAgent handles multiple consecutive turns without respawning
    Given Start-BusAgent spawned "debate-moderator" for feature "auth-flow"
    When the orchestrator sends a first event to the agent and waits for its result event
    And then sends a second event to the same agent and waits for its result event
    Then the agent_sessions row for "debate-moderator" retains the same session_id and pid throughout both turns
    And no additional agent_sessions row is inserted for "debate-moderator"

  @primary @integration
  Scenario: The system prompt delivered at spawn is tailored to the agent's role
    Given Start-BusAgent is called for role "review-moderator"
    When the orchestrator inspects the content delivered to the agent's stdin before any user message
    Then the system prompt content includes review-relevant routing rules and allowed event types
    And the system prompt content does not include event types disallowed for the review-moderator role
    And the system prompt content is distinct from the content generated for a "tla-writer" role

  @negative @integration
  Scenario: Start-BusAgent signals a mechanical error if the agent process fails to start
    Given the claude binary is unavailable or returns a non-zero exit immediately on startup
    When Start-BusAgent is called
    Then Start-BusAgent throws a mechanical error
    And no agent_sessions row is inserted with status="alive"
    And the error is surfaced to the router for halt processing

  @edge_case @boundary
  Scenario: Ctrl+C during Start-BusAgent mid-spawn leaves no leaked process
    Given Start-BusAgent has obtained a PID from the new claude process
    And the Ctrl+C handler fires before the agent_sessions row is inserted
    When the double-Ctrl+C handler executes
    Then Stop-ProcessTree is called for the PID obtained during spawn
    And the process is not left running in the OS after vibe.ps1 exits
    And agent_sessions has no orphaned row for that PID

# =============================================================================
# Item 3 — Agent Teardown (Stop-BusAgent, Stop-AllBusAgents)
# =============================================================================

Feature: Stop-BusAgent and Stop-AllBusAgents cleanly tear down agent processes
  Agents are stopped via Stop-ProcessTree and their sessions marked ended

  @primary
  Scenario: Stop-BusAgent kills the process and marks the session ended
    Given an agent with session_id "sess-001" is alive with PID 4321
    When Stop-BusAgent is called with session_id "sess-001"
    Then Stop-ProcessTree is called with PID 4321
    And the agent_sessions row for "sess-001" has status="ended"
    And ended_at is set to the current timestamp

  @primary
  Scenario: Stop-AllBusAgents tears down every alive agent
    Given agent_sessions contains three rows with status="alive" and PIDs 1001, 1002, 1003
    When Stop-AllBusAgents is called
    Then Stop-ProcessTree is called for PIDs 1001, 1002, and 1003
    And all three agent_sessions rows have status="ended"

  @edge_case @boundary
  Scenario: Stop-AllBusAgents is safe when no agents are alive
    Given agent_sessions contains no rows with status="alive"
    When Stop-AllBusAgents is called
    Then the function completes without error
    And no Stop-ProcessTree calls are made

  @primary @integration
  Scenario: Ctrl+C triggers Stop-AllBusAgents via the existing double-Ctrl+C handler
    Given one or more agents are alive with status="alive" in agent_sessions
    When the user presses Ctrl+C
    Then the existing double-Ctrl+C handler in vibe.ps1 invokes Stop-AllBusAgents
    And all alive agents are torn down via Stop-ProcessTree
    And final state is written to SQLite
    And the process exits non-zero

# =============================================================================
# Item 4 — Event Envelope and Routing (Send-BusEvent)
# =============================================================================

Feature: Send-BusEvent routes addressed envelopes to agents and handlers
  Every event carries a full envelope; the router validates before dispatching

  @primary
  Scenario: Send-BusEvent constructs a valid envelope with all required fields
    Given Send-BusEvent is called with from="tla-writer", to="debate-moderator", type="done", payload={"summary":"spec complete"}
    When the envelope is constructed
    Then the envelope contains a non-null evt_id that is unique among all event_log rows
    And from="tla-writer", to="debate-moderator", type="done"
    And the payload passes the done event JSON schema validation
    And in_reply_to is null when no reply context is provided

  @primary
  Scenario: Send-BusEvent includes in_reply_to when replying to an event
    Given Send-BusEvent is called as a reply to evt_id "evt-042"
    When the envelope is constructed
    Then in_reply_to="evt-042" appears in the envelope

  @primary
  Scenario: Send-BusEvent includes group_id when the event belongs to a group
    Given Send-BusEvent is called with group_id="grp-007"
    When the envelope is constructed
    Then group_id="grp-007" is present in the envelope

  @primary @integration
  Scenario: Router appends every routed event to event_log before dispatching
    Given Send-BusEvent is called with a valid envelope
    When the router processes the event
    Then a row is inserted into event_log with evt_id, from, to, in_reply_to, group_id, type, payload JSON, and status
    And the row is appended before the event is dispatched to the recipient

  @primary
  Scenario: Router infers the target when the event type has a deterministic routing rule
    Given the routing rule for type "verify" specifies that the target is always "tlc"
    And an agent sends a verify event with no to field
    When the router processes the event
    Then the router sets to="tlc" and dispatches to the tlc handler
    And no protocol_error is emitted

  @primary
  Scenario: Router dispatches to the correct agent stdin
    Given agent "bdd-writer" is alive with an open stdin stream
    And Send-BusEvent is called with to="bdd-writer"
    When the router dispatches
    Then the envelope JSON is written to "bdd-writer"'s stdin followed by a newline and flush

  @primary
  Scenario: Router dispatches to a handler synchronously when to is a reserved name
    Given "git" is a registered handler target
    And Send-BusEvent is called with to="git"
    When the router dispatches
    Then the git handler scriptblock is invoked synchronously with the event payload
    And no agent process is involved

  @negative @boundary
  Scenario: Envelope constructor rejects a duplicate evt_id at construction time
    Given evt_id "evt-099" has already been issued and appears in event_log
    When a new Envelope is constructed with evt_id="evt-099"
    Then the Envelope constructor raises an invariant violation before the envelope is passed to the router
    And no partial envelope object is created (the Envelope is never in a valid-but-duplicate state)
    And the invariant violation propagates to the router as a mechanical error
    And Stop-AllBusAgents is called
    And the process exits non-zero

  @boundary @edge_case
  Scenario: evt_id near the Int64 maximum causes a mechanical halt before wraparound
    Given the router's monotonic evt_id allocator has reached Int64.MaxValue - 1
    When the router attempts to allocate the next evt_id
    Then the router detects the boundary condition
    And halts with a mechanical error rather than wrapping around to a negative or zero value
    And the halt message identifies "evt_id exhaustion" as the cause

# =============================================================================
# Item 4b — Envelope Value-Object Invariants
# (DDD alignment: the Envelope enforces its own invariants at construction time;
# the router should be incapable of emitting an invalid envelope in the first place.)
# =============================================================================

Feature: The Envelope value object enforces its own invariants at construction time
  An Envelope that violates a structural invariant cannot be created; the router never holds a partially-valid Envelope

  @primary
  Scenario: Envelope construction fails when a required field is missing
    Given a caller attempts to construct an Envelope without the required "from" field
    When the Envelope constructor is invoked
    Then the constructor raises an invariant violation immediately
    And no Envelope object is returned to the caller
    And the caller receives an error identifying the missing field name

  @primary
  Scenario: Envelope construction fails when type is not a member of the closed enum
    Given a caller attempts to construct an Envelope with type="unknown_type"
    When the Envelope constructor is invoked
    Then the constructor raises an invariant violation
    And the error message identifies "unknown_type" as not a member of the 16-value closed enum

  @primary
  Scenario: Envelope construction succeeds and the returned object is immutable
    Given a caller constructs a valid Envelope with all required fields and a closed-enum type
    When the Envelope is returned
    Then the returned object's fields cannot be mutated after construction
    And every field read from the Envelope returns the value provided at construction time

  @negative @boundary
  Scenario: Envelope with an empty string evt_id is rejected at construction time
    Given a caller attempts to construct an Envelope with evt_id=""
    When the Envelope constructor is invoked
    Then the constructor raises an invariant violation
    And no Envelope with an empty evt_id is ever passed to the router

  @negative @boundary
  Scenario: Envelope with in_reply_to referencing a non-existent evt_id is rejected by the router
    Given a caller constructs a syntactically valid Envelope with in_reply_to="evt-999"
    And evt-999 does not appear in event_log
    When the router validates the envelope before dispatching
    Then the router rejects the envelope with a protocol_error back to the sender
    And the protocol_error payload identifies "in_reply_to references unknown evt_id: evt-999"
    And no envelope with an unresolvable in_reply_to is appended to event_log with status="routed"

# =============================================================================
# Item 4c — Fast @unit Tier for Core Envelope, Routing, Schema, and evt_id Primitives
# Each scenario in this section must complete in under 50ms with no I/O or real processes.
# =============================================================================

Feature: Core bus primitives are covered by fast @unit tests completing under 50ms
  These tests provide sub-50ms TDD red-green-refactor feedback for the four innermost bus primitives

  @unit
  Scenario: Envelope construction with all required fields produces a valid immutable object in under 50ms
    Given no external I/O or agent processes exist in this test
    When the Envelope constructor is called with from="tla-writer", to="debate-moderator", type="done", evt_id="evt-001", payload={"summary":"ok"}, in_reply_to=null, group_id=null
    Then the Envelope is returned without error
    And all seven fields are readable and match the values provided
    And the Envelope construction wall-clock time is under 50 milliseconds
    And mutating any field after construction raises an invariant violation

  @unit
  Scenario: Envelope constructor rejects missing from field without any I/O
    Given no external I/O or agent processes exist in this test
    When the Envelope constructor is called with the "from" field omitted
    Then the constructor raises an invariant violation identifying "from" as missing
    And no partial Envelope object is accessible to the caller
    And the failure occurs in under 50 milliseconds

  @unit
  Scenario: Routing-rule lookup returns the correct target for a known (role, type) combination in under 50ms
    Given the routing-rule table is loaded in memory with no SQLite or agent I/O
    When the routing-rule resolver is called with role="coding-worker" and type="done"
    Then it returns the expected target without error
    And the lookup wall-clock time is under 50 milliseconds
    And calling the resolver with role="tla-writer" and type="review_requested" returns a "disallowed" sentinel

  @unit
  Scenario: Event-type schema validation accepts a valid payload for each of the 16 types in under 50ms each
    Given the 16 per-type JSON schemas are loaded in memory with no SQLite or file I/O during validation
    When each valid sample payload is validated against its corresponding type schema
    Then every validation call returns "valid" without error
    And each individual validation call completes in under 50 milliseconds

  @unit
  Scenario: Event-type schema validation rejects a payload missing a required field in under 50ms
    Given the done event JSON schema requires a "summary" field
    When a done payload omitting "summary" is validated against the done schema
    Then validation returns an error identifying the missing "summary" field
    And the validation call completes in under 50 milliseconds

  @unit
  Scenario: evt_id allocator returns strictly monotonically increasing IDs in under 50ms each
    Given the evt_id allocator is initialized in isolation with no SQLite connection
    When the allocator is called 100 times consecutively
    Then each returned evt_id is strictly greater than the previous
    And no two returned evt_ids are equal
    And each allocation call completes in under 50 milliseconds

  @unit
  Scenario: evt_id allocator uses a single synchronization primitive preventing concurrent duplicate allocation
    Given two concurrent callers simultaneously request an evt_id from a mocked allocator with no SQLite dependency
    When both calls complete
    Then the two returned evt_ids are distinct
    And the allocator's synchronization primitive (e.g., a named mutex or interlocked atomic counter) is explicitly named in the test assertion comment
    And the test does not depend on thread ordering or sleep to produce the correct result
    And no SQLite connection is opened during this test (the allocator is verified in pure in-process isolation)

  @unit
  Scenario: TypeSenderACL in-memory check — routing-rule resolver rejects a sender emitting a type forbidden by role ACL in under 50ms
    Given the routing-rule table is loaded in memory with no SQLite or agent I/O
    And the TypeSenderACL rule forbids role="tla-writer" from emitting type="consensus_ratified"
    When the routing-rule resolver is called with role="tla-writer" and type="consensus_ratified"
    Then it returns the "acl_violation" sentinel without error (distinct from "disallowed" routing-rule sentinel)
    And the ACL check wall-clock time is under 50 milliseconds
    And no I/O or agent process is involved in the lookup
    And the resolver distinguishes "acl_violation" (sender-role forbidden by TypeSenderACL) from "disallowed" (routing-rule targeting mismatch)

  @quality_attribute
  Scenario: The entire @unit test suite completes in under 400ms total (architectural budget assertion)
    Given all tests tagged @unit are collected
    When the @unit suite is run in isolation on the CI runner specified in tests/bus/performance-baselines.json
    Then the total wall-clock time for the suite is under 400 milliseconds (8 tests × 50ms per-test budget = 400ms suite total)
    And the CI job fails if any single @unit test exceeds 50 milliseconds or the suite total exceeds 400 milliseconds

# =============================================================================
# Item 5 — Event Type Registry (Closed Enum + Schema Validation)
# =============================================================================

Feature: The bus enforces a closed enum of 16 event types with per-type schema validation
  Unknown types are rejected; known types have their payload validated against a JSON schema

  @data_driven @primary
  Scenario Outline: Each valid event type is accepted and appended to event_log
    Given the router is running with an in-memory SQLite database
    And a valid <type> envelope is constructed with a payload matching its JSON schema
    When the router processes the event
    Then the event is appended to event_log with status="routed"
    And no protocol_error is emitted

    Examples:
      | type                  |
      | bootstrap             |
      | ground_truth          |
      | done                  |
      | objection             |
      | objection_response    |
      | consensus_candidate   |
      | consensus_ratified    |
      | consensus_failed      |
      | verify                |
      | verify_result         |
      | review_requested      |
      | review_verdict        |
      | checkpoint            |
      | checkpoint_response   |
      | protocol_error        |
      | protocol_error_ack    |

  @negative
  Scenario: An event with an unknown type is rejected with protocol_error
    Given an agent sends an event with type="foobar_unknown"
    When the router processes the envelope
    Then the router emits a protocol_error event back to the sending agent
    And the error payload identifies "foobar_unknown" as the invalid type
    And the pipeline does not halt

  @negative
  Scenario: An event payload that fails schema validation is rejected with protocol_error
    Given an agent sends a "done" event with a payload missing a required field defined in the done JSON schema
    When the router validates the payload
    Then the router emits a protocol_error event back to the sending agent
    And the error payload includes the failing schema field name
    And the invalid event is not appended to event_log

  @primary
  Scenario: A valid payload that matches its event type schema is accepted without error
    Given an agent sends a "checkpoint_response" event whose payload matches the checkpoint_response JSON schema
    When the router validates the payload
    Then no protocol_error is emitted
    And the event is appended to event_log and dispatched

# =============================================================================
# Item 5b — protocol_error_ack Roundtrip (TLA+ v7 AgentEmitsAfterProtocolError)
# Zero scenarios existed for this first-class behavior before this revision.
# =============================================================================

Feature: An agent that receives a protocol_error acknowledges it with protocol_error_ack
  The router emits protocol_error; the agent corrects and emits protocol_error_ack; the router clears the pending flag

  @primary @integration
  Scenario: Happy-path protocol_error_ack roundtrip — agent corrects after receiving protocol_error
    Given an agent "tla-writer" is alive with ground_truth delivered
    And the router emits a protocol_error event to "tla-writer" because its prior envelope had type="review_requested" which is disallowed for its role
    And event_log records a protocol_error event with from="router", to="tla-writer"
    When "tla-writer" processes the protocol_error and emits a corrective event with type="protocol_error_ack"
    Then the router receives the protocol_error_ack and clears the pending-protocol-error flag for "tla-writer"
    And event_log records a protocol_error_ack event with from="tla-writer", to="router", in_reply_to referencing the protocol_error evt_id
    And the pipeline status remains "running" — no halt occurs
    And "tla-writer"'s status in agent_sessions remains "alive" throughout the roundtrip
    And subsequent valid events from "tla-writer" are routed without emitting another protocol_error

  @primary @integration
  Scenario: After protocol_error_ack the agent may immediately send a valid corrected event
    Given the protocol_error_ack roundtrip has completed for "tla-writer"
    When "tla-writer" emits a valid event with type="done" (an allowed type for its role)
    Then the router routes the done event without emitting a protocol_error
    And event_log records the done event with status="routed"
    And no second protocol_error is generated for the corrected event

  @negative @integration
  Scenario: Agent emitting protocol_error_ack without a preceding protocol_error is rejected
    Given an agent "bdd-writer" is alive with no pending protocol error (pendingProtocolError flag is FALSE)
    When "bdd-writer" sends an event with type="protocol_error_ack" without having first received a protocol_error
    Then the router rejects the unsolicited protocol_error_ack
    And the router emits a protocol_error back to "bdd-writer" identifying the unsolicited ack as a protocol violation
    And the unsolicited protocol_error_ack event is logged in event_log with status="rejected"
    And the pipeline does not halt

  @edge_case @integration
  Scenario: Checkpoint is deferred while a protocol_error is pending — router must wait for protocol_error_ack before initiating checkpoint
    Given agent "debate-moderator" is alive and its total_tokens have reached 82% of the model context window (above the 80% checkpoint threshold)
    And a protocol_error is pending for "debate-moderator" (pendingProtocolError = TRUE)
    When the router evaluates whether to initiate a checkpoint for "debate-moderator"
    Then the router does NOT emit a checkpoint event while pendingProtocolError is TRUE
    And the router waits until "debate-moderator" emits protocol_error_ack (clearing the pending flag)
    And only after the pending flag is cleared does the router emit the checkpoint event
    And event_log confirms the ordering: protocol_error → protocol_error_ack → checkpoint

  @failure_recovery @edge_case
  Scenario: Agent crashes while a protocol_error is pending — pending flag is cleared on crash; bus halts
    Given agent "tla-writer" has a pending protocol error (pendingProtocolError = TRUE)
    When "tla-writer"'s process exits unexpectedly before emitting protocol_error_ack
    Then the router detects end-of-stream on "tla-writer"'s stdout reader runspace
    And the router clears the pendingProtocolError flag for "tla-writer" as part of crash handling
    And the router halts with a mechanical error (failureCategory="agent_crash")
    And Stop-AllBusAgents is called

# =============================================================================
# Item 5c — Three-Way Event-Type Split Enforcement (TLA+ v10)
# BDD glossary previously defined only a two-way split; TLA+ v10 defines three.
# These scenarios enforce the operational constraints that were missing.
# =============================================================================

Feature: The router enforces the three-way event-type partition from TLA+ v10
  ConsensusEventTypes never reach handlers; consensus_ratified is only from="router"; override requires moderator role

  @primary @integration
  Scenario: Consensus events are never addressed to native handler targets
    Given the handler targets registered are "tlc", "tests", and "git"
    When any agent sends an event with type in {objection, objection_response, consensus_candidate, consensus_ratified, consensus_failed} with to="tlc" or to="tests" or to="git"
    Then the router rejects the event with a protocol_error
    And the consensus event is not appended to event_log with status="routed" targeting a handler
    And the pipeline does not halt

  @primary @integration
  Scenario: consensus_ratified events in event_log always have from="router"
    Given the router has processed a consensus cycle and emitted consensus_ratified
    When event_log is queried for all rows with type="consensus_ratified"
    Then every such row has from="router"
    And no row with type="consensus_ratified" has from set to any agent name or handler name

  @negative @integration
  Scenario: An agent attempting to emit consensus_ratified directly is rejected with protocol_error
    Given agent "debate-moderator" is alive
    When "debate-moderator" sends an event with type="consensus_ratified"
    Then the router rejects the event because agents are not permitted to emit consensus_ratified (only the router may)
    And the router emits a protocol_error back to "debate-moderator" identifying consensus_ratified as a router-only event type
    And no consensus_ratified event with from="debate-moderator" is appended to event_log

  @negative @integration
  Scenario: A handler emitting a consensus event addressed to an agent is rejected — direct handler-to-agent consensus events are forbidden
    Given handler "tlc" has completed a verify invocation and the HandlerAdapter is constructing the outbound verify_result
    And a misconfigured HandlerAdapter erroneously constructs an envelope with type="consensus_candidate" and to="debate-moderator" from="tlc"
    When the router validates the outbound envelope from the handler
    Then the router rejects the envelope because handler targets are not permitted to be the "from" of any ConsensusEventType
    And the router emits a mechanical error (this is a code-defect in the handler implementation, not a protocol_error from an agent)
    And no consensus event with from="tlc", from="tests", or from="git" is ever appended to event_log with status="routed"
    And Stop-AllBusAgents is called because handler emission of consensus events is a router-implementation invariant violation, not a recoverable protocol error

  @negative @integration
  Scenario: Override can only be submitted by an agent with the moderator role; non-moderator override is rejected
    Given agent "tla-writer" is alive with role="tla-writer" (not the moderator)
    And unresolved objection evt-031 exists in event_log
    And consensusState="candidate"
    When "tla-writer" sends a consensus_candidate event with an override field enumerating evt-031
    Then the router rejects the override because role="tla-writer" does not hold the moderator role
    And the router emits a protocol_error back to "tla-writer" identifying "non-moderator override attempt" as the violation
    And evt-031 remains in unresolvedObjections
    And no consensus_ratified event is emitted

# =============================================================================
# Item 6 — Routing Rules (Role × Type → Target)
# =============================================================================

Feature: The router enforces routing rules that constrain allowed sender-role and event-type combinations
  Disallowed combinations are rejected with protocol_error, not a halt

  @primary
  Scenario: A coding-worker sending a done event is routed to the expected target
    Given the routing rule for (coding-worker, done) specifies target="router" (aggregate)
    And a coding-worker agent sends a done event with no explicit to field
    When the router processes the event
    Then the router infers the target and appends the event to event_log with status="routed"
    And no protocol_error is emitted

  @negative
  Scenario: An agent sending a disallowed event type for its role receives protocol_error
    Given the routing rule forbids the "tla-writer" role from sending "review_requested"
    And the tla-writer agent sends a review_requested event
    When the router validates the routing rule
    Then the router emits a protocol_error back to "tla-writer" with the disallowed-type reason
    And the event is not dispatched
    And the pipeline does not halt
    And the pipeline continues routing subsequent valid events

  @negative
  Scenario: An agent addressing a disallowed target receives protocol_error
    Given routing rules disallow a "bdd-writer" agent from addressing "tests" directly
    And the bdd-writer sends an event with to="tests"
    When the router validates the routing rule
    Then the router emits a protocol_error back to "bdd-writer"
    And the pipeline does not halt

  @primary
  Scenario: Protocol violations are logged in event_log with status rejected
    Given an agent sends an event that violates a routing rule
    When the router emits a protocol_error back to the agent
    Then the protocol_error event is appended to event_log with type="protocol_error"
    And the original invalid envelope is logged with status="rejected"

  @primary @integration
  Scenario: An agent corrects its behavior after receiving a protocol_error
    Given an agent received a protocol_error event whose payload identifies type="review_requested" as disallowed
    When the agent processes the protocol_error and emits its next event
    Then event_log contains a new event from that agent with an allowed type, status="routed"
    And no second protocol_error is generated for the corrected event

# =============================================================================
# Item 7 — Group Fan-Out (Wait-BusGroup)
# =============================================================================

Feature: Wait-BusGroup holds aggregated responses until all group members reply
  Fan-out events carry a group_id; the router waits for all members before emitting the aggregated result

  @primary @integration
  Scenario: Router waits for all group members before emitting aggregated event
    Given a group "grp-writers" is defined with members "tla-writer" and "bdd-writer"
    And both members receive bootstrap events with group_id="grp-writers"
    When Wait-BusGroup is called with group_id="grp-writers"
    Then the function blocks until both "tla-writer" and "bdd-writer" have each emitted a done event with group_id="grp-writers"
    And Wait-BusGroup returns the aggregated done payloads from both members

  @primary @integration
  Scenario: Group resolves after all members reply regardless of reply order
    Given a group "grp-reviewers" contains members "reviewer-1", "reviewer-2", and "reviewer-3"
    When "reviewer-3" replies first, then "reviewer-1", then "reviewer-2"
    Then Wait-BusGroup returns only after all three have replied
    And the aggregated result contains responses from all three members

  @negative
  Scenario: A duplicate group reply from the same member is a mechanical error
    Given a group "grp-writers" contains members "tla-writer" and "bdd-writer"
    And "tla-writer" has already submitted a done event with group_id="grp-writers"
    When "tla-writer" sends a second done event with the same group_id
    Then the router detects a group invariant violation
    And the router halts with a mechanical error
    And Stop-AllBusAgents is called

  @negative
  Scenario: A non-member agent sending a group event is a mechanical error
    Given a group "grp-reviewers" contains members "reviewer-1" and "reviewer-2"
    When "debate-moderator" (not a member of grp-reviewers) sends an event with group_id="grp-reviewers"
    Then the router detects a group invariant violation
    And the router halts with a mechanical error

  @boundary @edge_case
  Scenario: Wait-BusGroup with an empty member set resolves immediately
    Given a group "grp-empty" is created with zero members
    When Wait-BusGroup is called with group_id="grp-empty"
    Then the function returns immediately without blocking
    And the aggregated result is an empty collection
    And no mechanical error is raised

  @boundary @edge_case
  Scenario: Wait-BusGroup with exactly one member resolves after that member replies
    Given a group "grp-solo" contains exactly one member "tla-writer"
    And "tla-writer" is sent a done event with group_id="grp-solo"
    When Wait-BusGroup is called with group_id="grp-solo"
    Then the function blocks until "tla-writer" replies with group_id="grp-solo"
    And Wait-BusGroup returns the single member's response

  @failure_recovery @edge_case
  Scenario: A group member crashing mid-fan-out causes a mechanical halt
    Given a group "grp-stage2" contains members "tla-writer" and "bdd-writer"
    And Wait-BusGroup is blocked waiting for both members
    And "bdd-writer" has already replied with its done event
    When "tla-writer" process exits unexpectedly before replying
    Then the stdout reader runspace detects end-of-stream for "tla-writer"
    And the router halts with a mechanical error
    And Stop-AllBusAgents tears down the remaining alive agents

  @primary @integration
  Scenario: Stage 2 parallel writers use a group to coordinate fan-out
    Given Stage 2 spawns "tla-writer" and "bdd-writer" with group_id="grp-stage2-writers"
    When both writers receive their bootstrap events
    Then Wait-BusGroup blocks until both emit done events with group_id="grp-stage2-writers"
    And stage 2 proceeds only after both writers have completed

  @primary @integration
  Scenario: Stage 7 per-task reviewers use a group to coordinate parallel review
    Given Stage 7 spawns "reviewer-1", "reviewer-2", "reviewer-3" for task "task-42" with group_id="grp-task-42-review"
    When Wait-BusGroup is called with group_id="grp-task-42-review"
    Then the function waits for all three reviewer done events before returning the aggregated verdict

# =============================================================================
# Item 8 — SQLite Tables (agent_sessions, event_log)
# =============================================================================

Feature: SQLite tables agent_sessions and event_log are created and used by the bus
  These tables enable crash recovery, observability, and ground-truth injection

  @primary
  Scenario: agent_sessions table has the required columns
    Given the database schema is inspected
    When agent_sessions is described
    Then it has columns: session_id, feature_name, role, instance_name, pid, status, group_id, checkpoint_json, started_at, ended_at

  @primary
  Scenario: event_log table has the required columns
    Given the database schema is inspected
    When event_log is described
    Then it has columns: evt_id, from, to, in_reply_to, group_id, type, payload (JSON), status

  @primary
  Scenario: event_log is append-only enforced by a SQLite trigger
    Given the database schema is inspected
    When the triggers on event_log are listed
    Then there is a trigger that raises an error on any UPDATE or DELETE against event_log
    And a test asserts that issuing "UPDATE event_log SET status='deleted' WHERE evt_id='evt-001'" causes the trigger to fire and the statement to fail

  @negative
  Scenario: Deleted tables debate_state, stage_outputs, and tier_progress no longer exist after migration
    Given the bidirectional-comms migration runs against a pre-migration database
    When the database schema is inspected after migration
    Then "debate_state" table does not exist
    And "stage_outputs" table does not exist
    And "tier_progress" table does not exist

  @primary
  Scenario: Existing tables not listed for deletion are untouched by the migration
    Given the database before migration includes features, stage_progress, pipeline_lock, artifacts, pipeline_state, task_results, merge_results, gate_results, session
    When the bidirectional-comms migration runs
    Then all of those tables still exist with their original schemas and row counts unchanged

  @negative
  Scenario: SQLite error causes a mechanical halt and full teardown
    Given the router attempts to append an event to event_log
    And the SQLite connection returns a locked or constraint-violation error
    When the error is caught
    Then the router halts with a mechanical error
    And Stop-AllBusAgents is called
    And the process exits non-zero

  @edge_case @failure_recovery
  Scenario: SQLite database file is deleted mid-run by an external process or disk failure
    Given the bus is running and event_log is on-disk SQLite at the path stored in the bus configuration
    And the SQLite .db file is deleted by an external process (e.g., rm -rf, disk failure, or OS eviction) while the router holds an open connection
    When the router next attempts to write to event_log (e.g., appending a routed event)
    Then the SQLite driver raises an error (SQLITE_CANTOPEN, SQLITE_IOERR, or equivalent)
    And the router catches the error and halts with a mechanical error (failureCategory="sqlite_error")
    And Stop-AllBusAgents is called
    And the process exits with exit code 14
    And the error message identifies the SQLite file path, the error code, and the context (event append mid-run) so the human can diagnose disk vs permission vs external-delete
    And -Resume will fail on the subsequent start because the SQLite file no longer exists — the error message must guide the user to restore from backup or restart fresh

# =============================================================================
# Item 9 — Halt Conditions
# =============================================================================

Feature: The router enforces exactly three terminal halt condition categories
  Semantic termination exits cleanly; mechanical error and user interrupt exit non-zero

  @data_driven @primary
  Scenario Outline: Each terminal halt condition triggers full teardown and correct exit code
    Given the bus is running for feature "auth-flow" with at least one alive agent
    When <trigger> occurs
    Then Stop-AllBusAgents is called
    And final bus state is written to SQLite (all alive rows marked ended)
    And the process exits with code <exit_code>
    And agent_sessions has zero rows with status="alive"

    Examples:
      | trigger                                               | exit_code | failure_category    |
      | consensus_ratified event is processed by the router   | 0         | (semantic)          |
      | consensus_failed event is processed by the router     | 0         | (semantic)          |
      | feature completion is signaled                        | 0         | (semantic)          |
      | user invokes ./vibe.ps1 -Rollback -SnapId <snap_id>   | 0         | (user_rollback)     |
      | Ctrl+C is pressed by the user                         | 1         | (user_interrupt)    |
      | a duplicate evt_id is detected                        | 10        | duplicate_evt_id    |
      | a group invariant violation is detected               | 11        | group_violation     |
      | a git commit fails outside Stage 7                    | 12        | git_commit          |
      | a handler binary is missing                           | 13        | handler_failure     |
      | an unknown handler target is addressed                | 13        | handler_failure     |
      | a SQLite write fails                                  | 14        | sqlite_error        |
      | an agent process exits unexpectedly                   | 15        | agent_crash         |
      | evt_id exhaustion (nextEvtId exceeds Int64.MaxValue)  | 16        | evt_id_overflow     |

  @primary
  Scenario: Each FailureCategory maps to a distinct non-zero exit code aligned with TLA+ ExitCodeOf
    Given the bus halts with failureCategory set to each of the 7 FailureCategories
    When the process exit code is observed for each failureCategory value
    Then duplicate_evt_id produces exit code 10
    And group_violation produces exit code 11
    And git_commit produces exit code 12
    And handler_failure produces exit code 13
    And sqlite_error produces exit code 14
    And agent_crash produces exit code 15
    And evt_id_overflow produces exit code 16
    And no two FailureCategories share an exit code
    And all 7 exit codes are distinct from 0 (semantic termination) and 1 (user_interrupt)

  @negative
  Scenario: Protocol errors are NOT halts; the pipeline continues routing
    Given an agent sends a malformed envelope
    When the router emits a protocol_error back to the agent
    Then the router continues routing other events
    And no halt occurs
    And no agent is torn down
    And the pipeline remains operational

# =============================================================================
# Item 10 — Crash Recovery (-Resume)
# =============================================================================

Feature: -Resume reconstructs the bus state from SQLite and re-spawns agents
  A crashed pipeline continues by querying agent_sessions and event_log

  @primary @failure_recovery
  Scenario: -Resume identifies which agents should be alive based on stage_progress
    Given the pipeline crashed during Stage 4 for feature "auth-flow"
    And agent_sessions records a "coding-worker" with status="ended" (crashed)
    And stage_progress indicates Stage 4 is in-progress
    When the user runs "./vibe.ps1 -Resume"
    Then the router queries agent_sessions and stage_progress to reconstruct logical-scope agents
    And spawns fresh processes for those agents

  @primary @failure_recovery
  Scenario: -Resume delivers bootstrap then ground_truth then latest checkpoint to each re-spawned agent
    Given an agent had a checkpoint stored in agent_sessions.checkpoint_json before the crash
    When -Resume re-spawns that agent
    Then the first three events delivered to the new process are: bootstrap, ground_truth, checkpoint_response (derived from checkpoint_json)
    And event_log records all three events with the new session_id as the recipient
    And the agent resumes from its last known state rather than starting from scratch

  @primary @failure_recovery
  Scenario: -Resume for an agent with no checkpoint delivers bootstrap then ground_truth only
    Given an agent crashed before any checkpoint was stored (checkpoint_json is null)
    When -Resume re-spawns that agent
    Then the agent receives bootstrap and ground_truth as its first two events
    And no checkpoint_response is sent
    And event_log confirms exactly two events were delivered before the first agent reply

  @primary @failure_recovery
  Scenario: -Resume does not re-deliver events that were already committed
    Given a crashed agent had processed events evt-001 through evt-015 with status="committed" in event_log before crashing
    When -Resume re-spawns the agent
    Then the router checks event_log for events with status="committed" for that AgentLifecycle
    And does not re-deliver any event whose evt_id appears in event_log with status="committed"
    And the in_reply_to chain in event_log preserves the link between the new session and the prior one

  @negative @failure_recovery @edge_case
  Scenario: -Resume when SQLite is locked by another running vibe.ps1 instance
    Given a vibe.ps1 process is currently running and holds the SQLite pipeline_lock
    When a second user runs "./vibe.ps1 -Resume"
    Then the second invocation detects the lock
    And prints an error message identifying the conflicting process
    And exits non-zero without spawning any agents or modifying SQLite state

  @negative @failure_recovery @edge_case
  Scenario: -Resume when checkpoint_json is malformed or schema-invalid
    Given agent_sessions.checkpoint_json for a crashed agent contains invalid JSON
    When -Resume attempts to re-spawn that agent using its checkpoint
    Then the router detects the malformed checkpoint_json
    And halts with a mechanical error rather than delivering corrupted state
    And the error message identifies the affected agent session_id and "malformed checkpoint_json"
    And the human must clean the checkpoint row before re-attempting

  @failure_recovery @edge_case
  Scenario: -Resume when git commit succeeded but event_log row was not written (partial commit)
    Given the pipeline crashed after a git commit for evt-042 completed successfully
    And event_log has no row for evt-042 (the SQLite write failed before or during the crash)
    When -Resume runs
    Then the router reconciles by querying git log for Vibe-Event-Id trailers
    And detects that evt-042 is present in git history but absent from event_log
    And inserts a synthetic event_log row for evt-042 with status="committed" before continuing
    And does not re-commit the changes already in git

  @failure_recovery @edge_case
  Scenario: -Resume when event_log row was written but git commit did not complete (inverse partial commit)
    Given event_log has a row for evt-042 with status="routed" (commit was in-flight when crash occurred)
    And git log shows no commit carrying "Vibe-Event-Id: evt-042"
    When -Resume runs
    Then the router detects the uncommitted event_log row
    And re-attempts the git commit for the changes associated with evt-042
    And updates the event_log row status to "committed" after the commit succeeds

  @failure_recovery @edge_case
  Scenario: -Resume when a worktree path no longer exists on disk
    Given agent_sessions contains a row with a working_tree path that has been deleted from disk
    When -Resume attempts to spawn an agent for that role
    Then the router detects that the worktree path is absent
    And halts with a mechanical error
    And the error message identifies the missing worktree path and the affected agent role

  @failure_recovery @edge_case
  Scenario: -Resume when agent_sessions shows status alive but the OS has no such PID
    Given agent_sessions contains a row with status="alive" and pid=9999
    And the OS reports no process with PID 9999
    When -Resume starts
    Then the router reclassifies that row's status from "alive" to "crashed" in agent_sessions
    And proceeds to re-spawn that agent as it would any other crashed agent
    And no Stop-ProcessTree call is made for the non-existent PID

  @failure_recovery @edge_case
  Scenario: -Resume when agent_sessions PID is alive but belongs to a different process due to kernel PID recycling
    Given agent_sessions contains a row with status="alive", pid=5555, and process_start_time="2026-04-18T10:00:00Z"
    And the OS reports a process with PID 5555 that is alive
    And the OS-reported process start time for PID 5555 is "2026-04-18T12:30:00Z" (different from the recorded start time, indicating PID recycling)
    When -Resume performs its PID liveness check
    Then the router detects the process-start-time mismatch between agent_sessions (10:00:00Z) and the live OS process (12:30:00Z)
    And the router reclassifies the agent_sessions row status from "alive" to "crashed" rather than treating PID 5555 as the original agent
    And no Stop-ProcessTree call is made for PID 5555 (it is a different, unrelated process)
    And the router proceeds to re-spawn the agent as if the original process had crashed
    And the error log entry identifies PID 5555 as a recycled PID, records both timestamps, and names the affected agent role

  @failure_recovery @edge_case
  Scenario: -Resume when three-way partial commit left commitLock unreleased
    Given the pipeline crashed after a git commit for evt-042 completed successfully
    And event_log has a row for evt-042 with status="committed"
    And the per-worktree commitLock mutex for "wt-auth-flow" was never released before the crash
    When -Resume starts
    Then the router detects that the commitLock holder PID is absent from the OS process list
    And releases the commitLock by forcibly reclaiming the named mutex "VibeBus-Commit-wt-auth-flow"
    And logs a warning via Write-PipelineLog identifying the stale lock, the associated evt_id, and the absent PID
    And proceeds to resume normally without re-committing evt-042 (already status="committed")

  @failure_recovery @edge_case
  Scenario: -Resume when a duplicate override was committed but consensus_ratified was never written
    Given evt-031 was overridden by the moderator in round 3 and the override was recorded in event_log before the crash
    And the crash occurred after the override was appended but before consensus_ratified was processed
    When -Resume re-spawns the moderator and it submits a new consensus_candidate that includes an override for evt-031
    Then the router checks event_log for prior override entries covering evt-031
    And detects that evt-031 has already been overridden (override row exists in event_log)
    And emits a protocol_error to the moderator identifying evt-031 as already overridden
    And does not emit consensus_ratified based on the duplicate override

  @failure_recovery @edge_case
  Scenario: -Resume when pipeline_lock is held by a process that is alive but unresponsive
    Given the pipeline_lock table contains a lock row with pid=8888 and locked_at set to 30 minutes ago
    And the OS reports process 8888 is still alive (but the process may be zombie, stuck, or paused)
    When the user runs "./vibe.ps1 -Resume"
    Then -Resume detects that pid=8888 is alive according to the OS
    And prints a warning identifying pid=8888, locked_at, and the fact that the process is still alive
    And exits non-zero without modifying the pipeline_lock row or spawning any agents
    And instructs the user to manually terminate pid=8888 if it is confirmed unresponsive before retrying -Resume

  @failure_recovery @edge_case
  Scenario: -Resume when pipeline_lock row exists but the holder PID no longer exists on the OS
    Given the pipeline_lock table contains a lock row with pid=7777 and locked_at set to 5 minutes ago
    And the OS reports no process with PID 7777
    When the user runs "./vibe.ps1 -Resume"
    Then -Resume detects that the pipeline_lock holder PID 7777 is absent from the OS process list
    And reclassifies the lock as stale, removes or overwrites the pipeline_lock row
    And proceeds to resume normally without aborting
    And logs a warning to Write-PipelineLog identifying the stale lock PID and its locked_at timestamp

  @failure_recovery @edge_case
  Scenario: -Resume when a respawned agent would produce a duplicate instance_name collision — RouterRespawnsAgent contract
    Given agent_sessions contains a crashed row with feature_name="auth-flow", role="debate-moderator", instance_name="debate-mod-01", status="ended"
    And -Resume is about to call Start-BusAgent for role="debate-moderator" with instance_name="debate-mod-01"
    And (due to a parallel -Resume invocation or a timing bug) a second agent_sessions row with instance_name="debate-mod-01" and status="alive" was inserted between the crash and this respawn attempt
    When Start-BusAgent attempts to insert the new agent_sessions row
    Then the SQLite UNIQUE constraint on (feature_name, instance_name, status="alive") prevents the duplicate insertion
    And Start-BusAgent detects the constraint violation and raises a mechanical error (failureCategory="sqlite_error") rather than spawning a duplicate agent
    And Stop-AllBusAgents is called for the current invocation
    And the error message identifies the duplicate instance_name="debate-mod-01" and the conflicting alive row's session_id
    And the human must resolve the collision (by stopping the alive agent or clearing the stale row) before retrying -Resume

  @primary
  Scenario: -Status prints current bus state from SQLite without modifying anything
    Given agents are running during Stage 6
    When the user runs "./vibe.ps1 -Status"
    Then Get-BusStatus queries agent_sessions and event_log
    And prints current live agents, their roles, PIDs, status, and elapsed idle time
    And no events are emitted and no agents are started or stopped

# =============================================================================
# Item 11 — Ground Truth Injection
# =============================================================================

Feature: Every outbound message to an agent is prepended with a role-specific ground_truth block
  Ground truth corrects stale beliefs before each agent turn; SQLite is the source of truth

  @primary @integration
  Scenario: Router prepends ground_truth before each user message to an agent
    Given an agent "debate-moderator" is about to receive a new objection_response
    When the router sends the event to the agent's stdin
    Then the message written to stdin contains a ground_truth block derived from current SQLite state
    And the ground_truth block precedes the objection_response payload in the same JSON line

  @primary
  Scenario: Ground truth content is role-specific
    Given a "tla-writer" agent and a "review-moderator" agent are both alive
    When the router prepends ground_truth to messages for each agent
    Then the ground_truth block sent to "tla-writer" contains TLA spec-relevant state fields
    And the ground_truth block sent to "review-moderator" contains review-relevant state fields
    And the two blocks are not identical

  @primary @integration
  Scenario: An agent receiving ground_truth with corrected state reflects the correction in its next outbound event
    Given an agent held a stale belief recorded in its last event payload as test_status="passing"
    And the ground_truth block prepended to the next inbound message indicates test_status="failing"
    When the agent processes the incoming message and emits its next outbound event
    Then the next event from that agent in event_log has a payload containing test_status="failing"
    And no payload from that agent after this turn contains test_status="passing"

  @primary @failure_recovery
  Scenario: A crashed-and-resumed agent receives ground_truth on its first post-resume message
    Given an agent was re-spawned after a crash
    When the router delivers the bootstrap event as the first stdin message
    Then that bootstrap message includes an embedded ground_truth block reflecting the full current SQLite state
    And event_log records a ground_truth event with the new session_id as recipient

  @quality_attribute @boundary
  Scenario: Ground truth block size does not exceed 8192 bytes (8 KB) per outbound message — size measured in bytes throughout
    Given a pipeline with 200 events already in event_log for feature "auth-flow"
    When the router computes the ground_truth block for any agent role
    Then the serialized ground_truth block is at most 8192 bytes (= 8 × 1024 bytes; this document uses bytes exclusively for all ground_truth size assertions)
    And the router raises a mechanical error if the computed block exceeds 8192 bytes before delivery
    And the performance-baselines.json key for this bound is "ground_truth_max_bytes" with value 8192 (integer, not a string like "8KB")

  @quality_attribute @boundary
  Scenario: Ground truth composition completes within the per-message latency budget
    Given a pipeline with 500 events in event_log and 12 alive agents in agent_sessions for feature "auth-flow"
    When the router composes the ground_truth block for any agent role immediately before delivering an outbound message
    Then the composition completes in under 50 milliseconds as measured at the Send-BusEvent call site
    And if any single composition call exceeds 50 milliseconds the router logs a warning via Write-PipelineLog identifying the agent role and actual duration
    And no inbound message to any agent is delayed by more than 50 milliseconds waiting for ground_truth composition

# =============================================================================
# Item 12 — Context Window Checkpointing (Session Renewal)
# =============================================================================

Feature: The router renews an agent's session when its context window approaches the limit
  Checkpointing is a graceful handoff consistent with no-arbitrary-limits policy

  @primary @integration
  Scenario: Router emits a checkpoint event when total_tokens exceeds 80 percent of model context window
    Given an agent's result event reports total_tokens at 81% of the model context window
    When the router evaluates the token usage after that result event
    Then the router emits a checkpoint event to that agent
    And event_log records the checkpoint event with status="routed"

  @primary @integration
  Scenario: Checkpoint sequence stores checkpoint_json, tears down, and spawns fresh
    Given the router emitted a checkpoint event to "tla-writer"
    And "tla-writer" responds with a checkpoint_response event containing its state summary
    When the router processes the checkpoint_response
    Then the router stores the checkpoint_response payload as checkpoint_json in the agent_sessions row for "tla-writer"
    And calls Stop-BusAgent for "tla-writer" (status="ended")
    And calls Start-BusAgent for the same role "tla-writer" and feature
    And the new agent receives bootstrap, ground_truth, and checkpoint_response as its first three events
    And the new session_id differs from the ended session_id (new row in agent_sessions)
    And the AgentLifecycle identity is preserved via matching feature_name, role, and instance_name

  @primary @integration
  Scenario: AgentLifecycle is an Aggregate Root — feature_name + role + instance_name uniquely identifies a lifecycle across all agent_sessions rows
    Given the agent_sessions table contains multiple rows for the same agent role across different session renewals: session_id="sess-001" (ended), session_id="sess-002" (ended), session_id="sess-003" (alive) — all for role="tla-writer" under feature_name="auth-flow" with instance_name="primary"
    When agent_sessions is queried for all rows matching feature_name="auth-flow", role="tla-writer", instance_name="primary"
    Then the three rows represent a single AgentLifecycle identity (not three separate agents)
    And the composite key (feature_name, role, instance_name) uniquely identifies the AgentLifecycle across all rows in agent_sessions for that feature
    And no two concurrent rows with status="alive" share the same (feature_name, role, instance_name) triple — this uniqueness is enforced by a UNIQUE partial index on agent_sessions WHERE status='alive'
    And the UNIQUE partial index name is "idx_agent_sessions_alive_identity" and its definition is verified in the migration schema test
    And a row with status="ended" or status="crashed" does NOT violate the partial index (historical rows for the same AgentLifecycle are permitted)

  @primary @integration
  Scenario: Checkpointing does not halt the pipeline
    Given an agent triggers the checkpoint renewal sequence
    When the full sequence completes (checkpoint → store → teardown → spawn → re-deliver)
    Then the pipeline continues routing events without halting
    And event_log records the checkpoint and checkpoint_response events

  @primary
  Scenario: Session renewal is triggered by real token usage not an arbitrary round count
    Given no round caps exist in the system
    When the router evaluates whether to checkpoint an agent
    Then the only trigger is result.usage.total_tokens exceeding ~80% of the model context window
    And an agent that has been through 50 rounds but has low token usage is NOT checkpointed

  @edge_case @boundary
  Scenario: Checkpoint racing with a pending done event in the same turn
    Given an agent emits both a done event and a checkpoint_response in the same result turn
    When the router processes the result
    Then the router completes the done event commit sequence before initiating checkpoint teardown
    And the done event's git commit and event_log status update complete before Stop-BusAgent is called
    And event_log records the done event with status="committed" before the checkpoint teardown event

  @edge_case @boundary
  Scenario: Checkpoint while the commit mutex is held by the commit serializer
    Given the commit serializer is currently holding the per-worktree mutex for "wt-auth-flow"
    And the router determines an agent in that worktree needs checkpointing
    When the router initiates the checkpoint sequence
    Then the router waits for the commit mutex to be released before calling Stop-BusAgent
    And the checkpoint teardown begins only after the mutex is available
    And no .git/index.lock collision occurs

  @primary @integration
  Scenario: AgentLifecycle identity is preserved across a session renewal
    Given an agent "tla-writer" is alive with session_id "sess-tla-01", feature_name="auth-flow", role="tla-writer", instance_name="tla-writer-01"
    When the checkpoint renewal sequence completes and a new process is spawned with session_id "sess-tla-02"
    Then agent_sessions contains a new row with session_id="sess-tla-02" and the same feature_name="auth-flow", role="tla-writer", instance_name="tla-writer-01"
    And no scenario in the system assigns a different instance_name or role to the replacement process
    And event_log can correlate the new session to the prior session via in_reply_to linking bootstrap events across the two session_ids

  @edge_case @boundary @failure_recovery
  Scenario: Checkpoint is not initiated when the agent is in consensusState=candidate
    Given an agent "debate-moderator" emitted a consensus_candidate event and its consensusState is "candidate"
    And the router's token-usage monitor observes that total_tokens would trigger the 80% checkpoint threshold for this agent
    When the router evaluates the checkpoint trigger
    Then the router defers the checkpoint until after the consensus decision is resolved (consensus_ratified, consensus_failed, or override accepted)
    And no checkpoint event is emitted while consensusState="candidate"
    And event_log records a deferred-checkpoint note identifying the reason as "consensus_candidate in flight"

  @edge_case @boundary @failure_recovery
  Scenario: Respawned agent after checkpoint sees its own unresolved objection from the prior session
    Given an agent "debate-moderator" with session_id "sess-mod-01" raised an objection with evt_id "evt-071"
    And evt-071 has no matching objection_response in event_log
    And the checkpoint renewal occurs, producing a new session_id "sess-mod-02"
    When the router delivers the ground_truth block to the new "sess-mod-02" process on first resume
    Then the ground_truth block includes evt-071 in the unresolvedObjections list
    And from the new session's perspective, evt-071 remains an open objection regardless of whether it was raised by the prior session_id

  @quality_attribute @boundary
  Scenario: checkpoint_json truncation preserves unresolvedObjections and must not silently omit them
    Given an agent submits a checkpoint_response with a very large state summary
    When the router attempts to store it as checkpoint_json
    Then if the serialized size exceeds 131072 bytes the router validates that the most-recent-state slice being stored still includes a complete and syntactically valid unresolvedObjections array
    And if truncation would remove or partially truncate the unresolvedObjections array, the router halts with a mechanical error rather than storing a silently truncated state
    And if truncation can preserve unresolvedObjections intact, the router stores the truncated checkpoint_json and logs a warning identifying the agent, the original size, and the truncated size
    And the truncation decision (store vs. halt) is explicit and not based on JSON parse success alone

  @failure_recovery @boundary @edge_case
  Scenario: Agent crashes after emitting checkpoint_response but before Stop-BusAgent completes teardown
    Given the router has received a checkpoint_response from "tla-writer" and stored checkpoint_json in the agent_sessions row
    And the router calls Stop-BusAgent as part of the checkpoint handoff sequence
    When "tla-writer" exits unexpectedly (OS kill or crash) before Stop-ProcessTree completes
    Then the stdout reader runspace detects end-of-stream for "tla-writer" during the teardown sequence
    And the router transitions to mechanical-error handling rather than the clean checkpoint teardown path
    And the already-stored checkpoint_json in agent_sessions remains intact and unmodified
    And -Resume can re-spawn "tla-writer" using the stored checkpoint_json as if it were a normal checkpoint recovery
    And event_log records the agent crash with status="ended" linked via in_reply_to to the interrupted checkpoint sequence

# =============================================================================
# Item 13 — Heartbeat Banner
# =============================================================================

Feature: The bus emits a heartbeat banner every 10 seconds
  The banner shows live agents with color-coded idle time and is written atomically

  @primary @quality_attribute
  Scenario: Heartbeat fires every 10 seconds regardless of pipeline activity
    Given the bus has at least one alive agent
    When 10 seconds elapse since the last heartbeat
    Then a new heartbeat banner is printed to the terminal
    And a new heartbeat entry is written to the pipeline log

  @primary @quality_attribute
  Scenario: Heartbeat banner uses UTF-8 box format with blank lines above and below
    Given the heartbeat banner is printed
    When its format is inspected
    Then it uses UTF-8 box-drawing characters
    And there is a blank line above and a blank line below the box

  @primary @quality_attribute
  Scenario: Heartbeat shows idle time color-coded by threshold
    Given agent "debate-moderator" has been idle for 90 seconds
    And agent "tla-writer" has been idle for 360 seconds
    When the heartbeat banner is printed
    Then "debate-moderator" row uses yellow idle-time formatting (>1m but ≤5m)
    And "tla-writer" row uses red idle-time formatting (>5m)

  @primary @integration
  Scenario: Heartbeat is written atomically via the Write-PipelineLog mutex
    Given multiple event-log writes and the heartbeat runspace are executing concurrently
    When the heartbeat attempts to print its multi-line banner
    Then the Write-PipelineLog mutex serializes access to Console::Out and the log file
    And no heartbeat lines appear interleaved with event-log lines in the log output

  @primary @quality_attribute
  Scenario: Heartbeat during Stage 7 groups agents compactly by task
    Given Stage 7 has three tasks each with a coding-worker and a reviewer
    When the heartbeat banner is printed
    Then agents are grouped by task in the banner display
    And the output renders as a compact grouped view rather than an ungrouped list

  @primary @quality_attribute
  Scenario: A stuck agent is visible in heartbeat but is not automatically terminated
    Given an agent has been idle for 10 minutes with no result event
    When the heartbeat banner is printed
    Then the agent appears with red idle-time formatting
    And the agent PID remains present in agent_sessions with status="alive"
    And no Stop-ProcessTree call is made automatically

  @negative @quality_attribute @edge_case
  Scenario: Heartbeat log file write failure increments a degraded counter and emits a single edge-triggered log entry
    Given the pipeline log file is unwritable due to disk-full or permission error
    When the heartbeat timer fires and the file write fails
    Then the heartbeat banner is still printed to terminal stdout
    And the file write failure is NOT silently swallowed — the router increments its heartbeat_degraded counter for that failure class
    And on the first transition from healthy to degraded (counter goes from 0 to 1), the router emits a single "[WARN]" entry via the terminal output path identifying the failure class ("log-file-write") and the error message
    And subsequent ticks in the same degraded state increment the counter without emitting additional log entries (edge-triggered, not level-triggered)
    And when the file write succeeds again (counter returns to 0), the router emits a single "[INFO]" entry recording the recovery and the total count of failed ticks during the degraded interval
    And no mechanical error or halt is raised from log file write failure alone

  @negative @quality_attribute @edge_case
  Scenario: Heartbeat terminal write failure increments a degraded counter and emits a single edge-triggered log entry to the file
    Given terminal stdout has been closed or redirected to a non-writable target
    When the heartbeat timer fires and Console::Out write fails
    Then the router increments its heartbeat_degraded counter for failure class "console-write"
    And on the first failure transition the router emits a single "[WARN]" entry to the log file path (which is still writable) identifying "console-write" as the failure class
    And the log file write still occurs if the file is writable
    And subsequent ticks in the same degraded state increment the counter without additional log entries (edge-triggered)
    And when console write recovers, a "[INFO]" recovery entry is emitted to the log file with the degraded tick count
    And no mechanical error or halt is raised from console write failure alone

  @edge_case @quality_attribute
  Scenario: heartbeat_degraded counter is reset on -Resume and bounded against integer overflow
    Given the pipeline has been running with degraded heartbeat log writes for 7 years at the 10-second cadence (approximately 22 million ticks — approaching 2^24 but far below 2^31)
    And the heartbeat_degraded counter for failure class "log-file-write" has accumulated at least 1000 ticks
    When the pipeline halts (for any reason) and the user runs "./vibe.ps1 -Resume"
    Then the router initializes all heartbeat_degraded counters to zero at the start of the resumed pipeline (counters do NOT persist across -Resume; they are in-process state)
    And the first heartbeat tick after -Resume starts from counter=0 for all failure classes
    And if the router is running continuously without -Resume: the heartbeat_degraded counter type is Int32 (or Int64) — if it approaches Int32.MaxValue (2,147,483,647), the router emits a "[WARN]" via the terminal path and saturates the counter at Int32.MaxValue rather than overflowing to a negative value
    And the saturation behavior is documented: at 1 failure per 10 seconds, saturation requires ≥ 680 years of continuous degraded operation; this is documented as the engineering justification for Int32 sufficiency

  @edge_case @quality_attribute
  Scenario: A slow Write-PipelineLog mutex does not cause the heartbeat to miss its 10-second tick
    Given the Write-PipelineLog mutex is held by a concurrent event-log write for 8 seconds
    When the 10-second heartbeat timer fires while the mutex is held
    Then the heartbeat tick is queued and fires immediately after the mutex is released
    And the delay is recorded in the heartbeat entry as an actual-vs-scheduled delta
    And the next heartbeat re-schedules from the actual fire time, not the scheduled time

  @quality_attribute @boundary
  Scenario: Write-PipelineLog mutex hold time per acquisition is capped at p99 ≤ 50ms to prevent ConcurrentQueue backup under high event throughput
    Given the bus is processing 50 events per second (the design aggregate throughput) and Write-PipelineLog is called on every routed event
    When a test measures the per-acquisition mutex hold time for Write-PipelineLog over 1000 consecutive acquisitions
    Then the p99 hold time per acquisition does not exceed 50 milliseconds (at 50 evt/s, a 50ms p99 hold queues at most 2.5 events behind one acquisition — acceptable)
    And the test fails if any single acquisition holds the mutex for more than 200 milliseconds (hard ceiling per acquisition — a 12-second hold that would queue 600 events is prohibited)
    And the p99 cap is committed to tests/bus/performance-baselines.json under key "write_pipeline_log_mutex_hold_p99_ms" as 50
    And the hard ceiling is committed as key "write_pipeline_log_mutex_hold_max_ms" as 200
    And the rate of hard-ceiling hits (acquisitions exceeding 200ms) does not exceed the bound committed under key "write_pipeline_log_ceiling_hit_rate_per_sec" — the bound is committed in performance-baselines.json as a maximum ceiling-hit rate per second (e.g., 0.1/sec = 1 in 500 acquisitions at 50 evt/s); the exact value is captured on first baseline run and enforced on subsequent runs
    And the CI job fails on either violation with separate failure messages distinguishing "p99 regression", "hard ceiling violation", and "ceiling-hit-rate exceeded"
    And "write_pipeline_log_ceiling_hit_rate_per_sec" is a measured baseline key, not a hardcoded constant — the rate is captured on the first baseline run and gated on subsequent runs (20% regression tolerance)

  @edge_case @quality_attribute
  Scenario: System clock jumps backward between heartbeat ticks due to NTP correction
    Given the heartbeat timer last fired at system time T1
    And an NTP correction causes the system clock to jump backward so the current time is less than T1
    When the heartbeat timer fires and computes idle time for an alive agent
    Then the idle-time calculation clamps any negative computed duration to zero
    And no exception or mechanical error is raised from the negative clock delta
    And the heartbeat banner displays "0s" for the affected agent's idle time rather than a negative or undefined value
    And the next heartbeat reschedules from the current adjusted system time, not from T1

  @edge_case @quality_attribute
  Scenario: System clock jumps forward between heartbeat ticks due to NTP correction
    Given the heartbeat timer last fired at system time T1
    And an NTP correction causes the system clock to jump forward by 90 seconds so the computed idle time for all agents becomes inflated
    When the heartbeat timer fires and computes idle time for an alive agent whose last result event was at T1
    Then the idle-time calculation detects that the forward jump exceeds the expected heartbeat interval by a configurable threshold (default: 30 seconds)
    And the heartbeat logs a "clock-jump-forward" warning via Write-PipelineLog identifying the jump magnitude
    And no automatic yellow/red idle-time alerts are fired solely due to the jump inflating the computed idle time
    And the heartbeat banner displays the computed idle time with a "(clock-adjusted)" annotation
    And the next heartbeat reschedules from the current adjusted system time

  @negative @quality_attribute
  Scenario: DST transition does not produce duplicate or missing idle time because all timestamps are UTC
    Given the pipeline is running across a DST boundary that would double-count or skip one hour in local time
    When the heartbeat computes idle times for alive agents
    Then all agent started_at, last result_at, and heartbeat timestamps are stored and compared as UTC
    And the idle-time calculation produces a monotonically non-decreasing result across the DST boundary
    And no agent is incorrectly shown as idle for a negative duration or for an additional 3600 seconds

  @quality_attribute @edge_case
  Scenario: Heartbeat delta exceeding 10 seconds triggers a pipeline-log alarm entry
    Given the heartbeat is scheduled to fire every 10 seconds
    And the Write-PipelineLog mutex was held for 12 seconds before the heartbeat could acquire it
    When the heartbeat fires 12 seconds after its scheduled time
    Then the heartbeat banner notes the actual-vs-scheduled delta
    And Write-PipelineLog records an alarm-level entry (not just a warning) identifying the heartbeat as delayed by more than 10 seconds
    And the alarm entry includes the agent names that were alive during the delayed interval
    And the alarm is emitted as a distinct log-level entry (e.g., "[ALARM]") so it can be filtered by operational monitoring

  @quality_attribute @boundary
  Scenario: pipeline-log.ps1 rotates when it reaches the configured size threshold
    Given Write-PipelineLog is configured with a rotation threshold of 50 MB (configurable)
    And pipeline-log.ps1 has grown to exactly the rotation threshold
    When Write-PipelineLog is called for the next log entry
    Then pipeline-log.ps1 is renamed to pipeline-log-<ISO8601-timestamp>.ps1 in the same directory
    And a new pipeline-log.ps1 is created and all subsequent writes go to the new file
    And the first entry in the new pipeline-log.ps1 records the rotation event with the archived file name
    And archived log files beyond the configured retention limit (default: 5) are deleted oldest-first
    And the rotation does not cause a mechanical error or interrupt the pipeline

# =============================================================================
# Item 14 — Hybrid Consensus
# =============================================================================

Feature: Hybrid consensus requires moderator agreement AND PowerShell event_log validation
  consensus_ratified is emitted only when both the moderator and the router independently agree

  @primary @integration
  Scenario: consensus_ratified is emitted when both moderator and router agree
    Given the debate moderator emits a consensus_candidate event
    And PowerShell queries event_log and finds no objection events without a matching objection_response
    When the router evaluates the hybrid consensus check
    Then the router emits a consensus_ratified event
    And event_log records consensus_ratified with status="routed"

  @negative @integration
  Scenario: consensus_ratified is NOT emitted when event_log has unresolved objections
    Given the debate moderator emits a consensus_candidate event
    And event_log contains objection evt-031 and evt-032 with no matching objection_response rows
    When the router evaluates the hybrid consensus check
    Then the router does NOT emit consensus_ratified
    And the router sends a reply to the moderator whose payload lists the unresolved evt_ids [evt-031, evt-032]

  @primary @integration
  Scenario: Moderator can explicitly override specific unresolved objections
    Given the router sent the moderator unresolved evt_ids [evt-031, evt-032]
    And the moderator sends a new consensus_candidate with an override field enumerating evt_ids [evt-031, evt-032]
    And the override field includes a non-empty reason string
    When the router evaluates the hybrid consensus check
    Then the router emits consensus_ratified
    And event_log records an override entry with the override reason, the overriding session_id, and the enumerated evt_ids

  @negative @edge_case
  Scenario: Moderator cannot override the same objection evt_id twice across rounds
    Given evt-031 was overridden by the moderator in round 3 and recorded in event_log
    And a new consensus_candidate in round 5 includes an override field that again lists evt-031
    When the router evaluates the hybrid consensus check
    Then the router rejects the duplicate override
    And emits a protocol_error to the moderator identifying evt-031 as already overridden
    And does not emit consensus_ratified

  @primary @integration
  Scenario: Moderator re-resolves objections formally and resubmits consensus_candidate
    Given the router sent the moderator unresolved evt_ids [evt-031, evt-032]
    And the moderator emits objection_response events for both evt-031 and evt-032
    And the moderator re-emits a consensus_candidate with no override field
    When the router re-evaluates the hybrid consensus check
    Then event_log shows both objections have matching objection_response rows
    And the router emits consensus_ratified

# =============================================================================
# Item 15 — Git Commit Serialization and Idempotency
# =============================================================================

Feature: The commit serializer writes one commit per done event with a per-worktree mutex
  Git operations are serialized per worktree; resume does not re-commit already-committed events

  @primary @integration
  Scenario: Each done event triggers exactly one git commit in the agent's worktree
    Given an agent emits a done event for task "task-07"
    When the commit serializer processes the done event
    Then exactly one git commit is created in the worktree associated with "task-07"
    And the commit message includes the "Vibe-Event-Id: <evt_id>" trailer
    And the commit message includes the "Vibe-Group-Id: <group_id>" trailer if group_id is present
    And event_log updates the done event row to status="committed"

  @primary @integration
  Scenario: Commit serializer holds a per-worktree mutex during each commit
    Given two agents share the same worktree "wt-auth-flow"
    And both emit done events at nearly the same time
    When the commit serializer processes both events
    Then the per-worktree mutex ensures only one commit runs at a time
    And the second commit begins only after the first completes and the mutex is released

  @primary @integration
  Scenario: Git index.lock contention is prevented by the per-worktree mutex
    Given the commit serializer holds the mutex for worktree "wt-auth-flow"
    When a second commit attempt for the same worktree arrives
    Then the second attempt waits for the mutex to be released before starting
    And no .git/index.lock collision error occurs

  @negative @integration
  Scenario: Parallel writers touching overlapping file paths cause a mechanical halt detected via git diff --cached
    Given "tla-writer" and "bdd-writer" are producing changes in Stage 2
    And both writers have staged changes to the same file path "docs/bidirectional-comms/spec.tla" (a disjoint-path violation)
    When the commit serializer acquires the mutex and runs "git diff --cached --name-only" before committing the second writer's changes
    Then the serializer parses the output of "git diff --cached --name-only" and finds "docs/bidirectional-comms/spec.tla" also present in the first writer's already-committed change set (from git log --format='%H' -1 combined with git show --name-only)
    And the router halts with a mechanical error before the second commit is executed
    And the halt message identifies the overlapping path "docs/bidirectional-comms/spec.tla" and both writer agents

  @negative @integration
  Scenario: Git commit failure outside Stage 7 rolls back the git index before halting
    Given the commit serializer attempts a commit in Stage 4
    And git commit exits with code 1 leaving the index in a staged-but-uncommitted state
    When the serializer catches the failure
    Then the serializer runs "git reset HEAD" to unstage the staged changes before halting
    And the router halts with a mechanical error after the index is clean
    And the pipeline halts with exit code 12 (failureCategory="git_commit" per TLA+ ExitCodeOf)
    And event_log records the failed event with status="routed" (not "committed")
    And a subsequent -Resume inherits a clean git index, not a staged-but-uncommitted state

  @primary @integration
  Scenario: Stage 7 merge-queue path handles cross-task integration conflicts
    Given Stage 7 has a merge conflict between task-branch "task-01" and "task-02"
    When the merge-queue processes the conflict
    Then the existing merge-queue logic resolves it
    And the bus commit serializer does not intervene

  @primary @failure_recovery
  Scenario: Resume idempotency is enforced via event_log status committed check
    Given event_log contains rows for evt-001 through evt-015 with status="committed" from a previous run
    When the router re-starts after a crash and processes those event ranges during resume
    Then the router checks status="committed" before re-delivering any event
    And no re-commit is attempted for events already marked committed
    And git log shows no duplicate commits carrying the same Vibe-Event-Id

# =============================================================================
# Item 16 — Agent Lifetimes (Logical Scope)
# =============================================================================

Feature: Agent processes have bounded lifetimes determined by their logical scope
  Writers survive stage boundaries; other roles are bounded to their scope unit

  @data_driven @primary
  Scenario Outline: Agent processes have correct logical-scope lifetimes
    Given Start-BusAgent spawned an agent for role "<role>" at <spawn_point>
    When <scope_end> is reached
    Then Stop-BusAgent is called for that agent
    And the agent_sessions row for that agent has status="ended" with a non-null ended_at

    Examples:
      | role              | spawn_point               | scope_end                               |
      | tla-writer        | Stage 2 start             | Stage 3 consensus_ratified              |
      | bdd-writer        | Stage 2 start             | Stage 3 consensus_ratified              |
      | debate-moderator  | debate start              | consensus_ratified or consensus_failed  |
      | coding-worker     | task dispatch             | task done event committed               |
      | reviewer          | review phase start        | review_verdict received                 |

  @primary @integration
  Scenario: TLA writer spawned in Stage 2 serves Stage 3 objections without re-spawning
    Given Start-BusAgent spawned "tla-writer" at the start of Stage 2
    And Stage 2 completes and Stage 3 begins
    When the Stage 3 debate moderator emits an objection targeting "tla-writer"
    Then the router routes the objection to the existing "tla-writer" process
    And the agent_sessions row for "tla-writer" retains the same session_id and pid
    And no new agent_sessions row is inserted for role="tla-writer"

# =============================================================================
# Item 17 — Native Tool Handlers (HandlerAdapter)
# =============================================================================

Feature: TLC, tests, and git are bus handlers invoked synchronously through the HandlerAdapter
  Agents address handlers as peers; the HandlerAdapter translates bus envelopes to native tool invocations

  @data_driven @primary
  Scenario Outline: Handler dispatch is synchronous and wraps the result in a verify_result event
    Given Register-BusHandler has registered a scriptblock for "<handler>"
    And an agent sends a verify event with to="<handler>" and a valid verify payload
    When the router dispatches the event
    Then the <handler> handler scriptblock is invoked synchronously with the verify payload
    And no new claude process is spawned
    And the result is wrapped in a verify_result event returned to the requesting agent via the HandlerAdapter
    And event_log records the verify and verify_result events

    Examples:
      | handler |
      | tlc     |
      | tests   |
      | git     |

  @primary @integration
  Scenario: Register-BusHandler registers a named handler scriptblock
    Given Register-BusHandler is called with name="tlc" and a scriptblock
    When the router receives an event with to="tlc"
    Then the registered scriptblock is invoked with the event payload

  @negative @integration
  Scenario: Addressing an unregistered handler name causes a mechanical halt
    Given no handler is registered for the name "foobar"
    And an agent sends an event with to="foobar"
    When the router attempts dispatch
    Then the router halts with a mechanical error
    And Stop-AllBusAgents is called

  @negative @integration
  Scenario: Missing handler binary causes a mechanical halt
    Given the TLC handler scriptblock is registered
    And the TLC binary is not found when the scriptblock executes
    When the handler throws
    Then the router halts with a mechanical error
    And Stop-AllBusAgents is called

  @primary @integration
  Scenario: HandlerAdapter inbound phase (HandlerAdapterReceives) records the requesting agent and evt_id before invoking the handler
    Given agent "tla-writer" is alive with ground_truth delivered and sends a verify event to="tlc" with evt_id="evt-088"
    When the HandlerAdapter processes the inbound verify envelope (HandlerAdapterReceives phase)
    Then the adapter records handlerPendingEvt["tlc"]="evt-088" and handlerPendingAgent["tlc"]="tla-writer" before invoking the TLC scriptblock
    And the handler state for "tlc" transitions from "idle" to "busy"
    And event_log records the verify event with from="tla-writer", to="tlc", status="routed"
    And the TLC scriptblock is invoked synchronously with the verify payload

  @primary @integration
  Scenario: HandlerAdapter outbound phase (HandlerAdapterCompletes) derives the response target and in_reply_to strictly from the recorded correlation — not from ambient state
    Given the HandlerAdapter has completed the TLC invocation for handler="tlc" with handlerPendingEvt["tlc"]="evt-088" and handlerPendingAgent["tlc"]="tla-writer"
    When HandlerAdapterCompletes fires (outbound translation phase)
    Then the adapter constructs a verify_result envelope with to="tla-writer" and in_reply_to="evt-088" derived exclusively from handlerPendingEvt and handlerPendingAgent
    And the adapter does NOT derive the target or in_reply_to from any other routed event_log record (no ambient correlation)
    And event_log records a verify_result event with from="tlc", to="tla-writer", in_reply_to="evt-088"
    And handlerState["tlc"] returns to "idle" and handlerPendingEvt["tlc"] and handlerPendingAgent["tlc"] are cleared to NULL

  @failure_recovery @edge_case
  Scenario: Agent crashes between HandlerAdapterReceives and HandlerAdapterCompletes — handler clears its state and bus halts
    Given the HandlerAdapter is in the busy window for handler="tlc" with handlerPendingAgent["tlc"]="tla-writer"
    And "tla-writer" exits unexpectedly before the TLC invocation completes
    When HandlerFails fires for handler="tlc" (modeling the timeout or handler completion after the requesting agent is gone)
    Then the handler state for "tlc" returns to "idle" and handlerPendingEvt["tlc"] and handlerPendingAgent["tlc"] are cleared
    And the router halts with failureCategory="handler_failure" (the requesting agent's crash was detected concurrently and may also trigger agent_crash halt — whichever fires first is the recorded category)
    And Stop-AllBusAgents is called

# =============================================================================
# Item 18 — Stdout Reader and Flow Control
# =============================================================================

Feature: The stdout reader pattern prevents stream contention and signals turn completion
  One runspace per agent uses blocking ReadLine; the result event signals turn completion

  @primary @integration
  Scenario: One dedicated runspace reads stdout for each agent
    Given Start-BusAgent spawned two agents "tla-writer" and "bdd-writer"
    When both agents are running
    Then exactly two reader runspaces exist, one per agent
    And no concurrent ReadLineAsync calls are made within a single agent's reader runspace

  @primary @integration
  Scenario: The orchestrator waits for a result event before sending the next message to an agent
    Given the orchestrator sent a message to "tla-writer"
    And "tla-writer" is producing assistant events
    When "tla-writer" emits a result event
    Then the orchestrator treats the turn as complete
    And the orchestrator's next message to "tla-writer" is sent only after the result event is received

  @primary @integration
  Scenario: ConcurrentQueue decouples the runspace reader from the orchestrator thread
    Given an agent is emitting output on stdout
    When the stdout reader runspace enqueues each JSON line into the ConcurrentQueue
    Then the orchestrator drains the queue and fires engine events on its own thread
    And no concurrent ReadLine calls occur on the same stream

  @primary
  Scenario: system/init event on agent stdout is recognized as session metadata
    Given an agent just started and emits a system/init event on stdout
    When the orchestrator processes the event
    Then system/init is recognized as session metadata (tools, model, session_id)
    And the orchestrator logs it but does not treat it as turn-complete

  @primary
  Scenario: assistant events on agent stdout do not signal turn completion
    Given an agent emits assistant events containing message.content[] blocks
    When the orchestrator processes the assistant events
    Then the orchestrator does not treat them as turn-complete
    And it waits for the subsequent result event before sending the next message

  @edge_case @quality_attribute
  Scenario: ConcurrentQueue backpressure when the orchestrator stalls
    Given an agent is emitting stdout output at high volume
    And the orchestrator thread is stalled processing an unrelated synchronous operation
    When the agent's stdout buffer fills because the ConcurrentQueue is not being drained
    Then the agent's write calls block on stdin (natural TCP/pipe backpressure)
    And the agent PID remains alive in agent_sessions with status="alive"
    And the heartbeat banner shows the agent as idle (no result events received)
    And no mechanical error is raised solely from the queue depth increasing

  @failure_recovery @edge_case
  Scenario: Stdin Flush IOException when event is routed but pipe is closed before bytes are drained
    Given Send-BusEvent has appended an event to event_log with status="routed" for agent "tla-writer"
    And the router calls StandardInput.WriteLine followed by StandardInput.Flush for "tla-writer"
    And "tla-writer"'s stdin pipe is closed (process exit or OS pipe error) between the WriteLine and the Flush call
    When StandardInput.Flush throws an IOException
    Then the router catches the IOException
    And reclassifies the event_log row for that event from status="routed" to status="delivery_failed"
    And treats the agent crash as a mechanical error: halts, calls Stop-AllBusAgents, and exits non-zero
    And on -Resume, the router re-delivers the delivery_failed event to the newly spawned agent before any subsequent events

  @quality_attribute @edge_case
  Scenario: ConcurrentQueue depth exceeding the alarm threshold triggers a pipeline-log warning
    Given the operational alarm threshold for ConcurrentQueue depth is 500 unprocessed lines (configurable, not a mechanical-halt limit)
    And the orchestrator thread has been stalled for an extended period without draining the queue
    When the per-agent ConcurrentQueue depth reaches 500 unprocessed lines
    Then Write-PipelineLog records a warning entry identifying the agent name, current queue depth, and elapsed time since the last drain
    And the heartbeat banner highlights that agent with a distinct queue-depth indicator alongside its idle-time display
    And no mechanical error is raised from the queue depth alone
    And the warning repeats on every subsequent heartbeat tick until the queue depth falls below the threshold

# =============================================================================
# Item 19 — -Status Flag, Get-BusStatus, and Bus Health Metrics
# =============================================================================

Feature: vibe.ps1 accepts -Status to inspect bus state without starting or stopping anything
  Get-BusStatus provides SQLite-backed bus state including queue depth and health metrics

  @primary
  Scenario: -Status is a valid vibe.ps1 parameter distinct from -Resume and $Seed
    Given vibe.ps1 defines its parameter block
    When the parameters are inspected
    Then there is a -Status switch parameter
    And it is distinct from -Resume and the Seed positional parameter

  @primary @quality_attribute
  Scenario: Running vibe.ps1 -Status prints agent state and health metrics
    Given three agents are alive with roles "tla-writer", "bdd-writer", "debate-moderator"
    When the user runs "./vibe.ps1 -Status"
    Then Get-BusStatus prints each alive agent's role, instance_name, PID, status, and elapsed idle time
    And it prints the per-agent ConcurrentQueue depth (number of unprocessed lines waiting to be drained)
    And it prints the last observed event_log write latency in milliseconds
    And it prints recent event_log entry counts grouped by type
    And no agents are started or stopped

  @primary
  Scenario: -Status with no bus running shows idle state and exits zero
    Given no agents are in agent_sessions with status="alive"
    When the user runs "./vibe.ps1 -Status"
    Then Get-BusStatus prints "No agents currently alive"
    And the process exits zero

  @quality_attribute @integration
  Scenario: ConcurrentQueue depth sustained above threshold for 3 consecutive heartbeats emits an operational alarm to Write-PipelineLog
    Given the operational alarm threshold for ConcurrentQueue depth is 500 unprocessed lines (configurable)
    And a specific agent's ConcurrentQueue depth has exceeded 500 for three consecutive heartbeat ticks (at least 30 seconds)
    When the fourth heartbeat tick fires
    Then Write-PipelineLog records an "[ALARM]"-level entry (distinct from "[WARN]") identifying the agent name, current queue depth, and duration sustained above threshold
    And the alarm is emitted proactively without requiring the user to run -Status
    And the alarm message is distinct from the per-tick warning that fires on the first threshold crossing
    And no mechanical error is raised from queue depth alone

  @quality_attribute @integration
  Scenario: Heartbeat delta exceeding 10 seconds emits an operational alarm to Write-PipelineLog
    Given the heartbeat fires 11 seconds after its scheduled time due to mutex contention or system load
    When the heartbeat measures its actual-vs-scheduled delta as 11 seconds
    Then Write-PipelineLog records an "[ALARM]"-level entry identifying the delayed tick, the delta in seconds, and the agents that were alive during the delay
    And this alarm is proactively written to the log without requiring the user to run -Status
    And the next scheduled heartbeat is adjusted to fire 10 seconds from the actual fire time of the delayed tick

# =============================================================================
# Item 20 — Migrated Invoke-Claude Call Sites and Atomic Cutover
# =============================================================================

Feature: All non-interactive Invoke-Claude call sites in Stages 2-7 are migrated to the bus
  Invoke-Claude is retained only for Stage 1; migration is a single atomic commit

  @primary @integration
  Scenario: No non-interactive Invoke-Claude call exists in Stage 2
    Given Stage 2 source files are loaded
    When all Invoke-Claude usages in stages/2-*.ps1 are examined
    Then no Invoke-Claude call lacks the -Interactive flag
    And all agent communication in Stage 2 uses Send-BusEvent or Start-BusAgent

  @primary @integration
  Scenario: No non-interactive Invoke-Claude call exists in Stages 3 through 7
    Given Stage 3 through Stage 7 source files are loaded
    When all Invoke-Claude usages in those stage scripts are examined
    Then no Invoke-Claude call lacks the -Interactive flag
    And all agent communication uses the bus public functions

  @primary
  Scenario: Stage 1 retains Invoke-Claude with -Interactive
    Given Stage 1 (elicitor) source is inspected
    When Invoke-Claude usages in stages/1-*.ps1 are examined
    Then Invoke-Claude is called with -Interactive for the TTY session
    And Stage 1 does not reference any bus public function

  @primary @integration
  Scenario: The migration cutover is atomic — no commit on the main branch leaves Stages 2-7 in a hybrid state
    Given the git log for the main branch is inspected around the migration commit
    When each commit is checked for mixed usage of Invoke-Claude (non-interactive) and bus functions in Stages 2-7
    Then no commit exists where some stage scripts use the bus and other stage scripts use Invoke-Claude (non-interactive)
    And the transition from full Invoke-Claude to full bus is contained in a single commit

  @primary @integration
  Scenario: A pre-merge CI job rejects pull requests containing mixed-usage commits before they land on main
    Given a pull request is opened targeting the main branch
    And the PR contains at least one commit that has both non-interactive Invoke-Claude calls and bus public function calls in Stage 2-7 files within the same commit
    When the pre-merge CI job named "atomic-cutover-check" runs on that PR
    Then the CI job fails and the PR merge is blocked
    And the failure message identifies the commit SHA and the specific Stage 2-7 file paths containing mixed usage
    And the PR author must either complete the migration in that commit or split the commit before the PR can merge

  @primary @integration
  Scenario: A CI job rejects any pull request that introduces a non-interactive Invoke-Claude call in Stages 2-7 after the migration commit
    Given the migration cutover commit has landed on the main branch
    And a subsequent pull request modifies a Stage 2-7 file and adds a non-interactive Invoke-Claude call (without -Interactive flag)
    When the CI job named "no-invoke-claude-regression" runs on that pull request
    Then the CI job fails and the PR merge is blocked
    And the failure message identifies the file path and line containing the non-interactive Invoke-Claude call
    And the PR author must replace the call with bus public functions before the PR can merge
    And this enforcement is permanent: the CI job runs on every PR targeting main regardless of pipeline stage

  @primary @integration
  Scenario: The no-invoke-claude-regression CI gate uses a PowerShell AST walker not a bare text search
    Given the CI job "no-invoke-claude-regression" is configured
    When a Stage 2-7 source file is analyzed
    Then the gate uses the PowerShell AST (Abstract Syntax Tree) parser via [System.Management.Automation.Language.Parser]::ParseFile to identify Invoke-Claude command invocations
    And the AST walk inspects CommandAst nodes whose CommandName equals "Invoke-Claude" and checks whether a -Interactive parameter is bound
    And bare text matches (e.g., grep/Select-String on "Invoke-Claude") are NOT used as the detection algorithm because they false-positive on comments, string literals, and documentation
    And the AST walk explicitly excludes the following false-positive paths: files matching "*.md", "*.psd1", "*.Tests.ps1" in tests/helpers/, and any CommandAst where the literal string "Invoke-Claude" appears as a string argument rather than a command name
    And the gate produces a structured failure report listing: file path, line number, column number, and the full CommandAst text for each detected violation
    And a Stage 1 legitimate Invoke-Claude -Interactive call in stages/1-*.ps1 is NOT reported as a violation (whitelist by path pattern "stages/1-")

# =============================================================================
# Item 21 — Stateless Invocation Pattern Is Eliminated
# (Revised from implementation-focus: file existence checks)
# Stakeholder-observable: agents retain context across turns, no cold-start behavior.
# =============================================================================

Feature: Pipeline stages operate without stateless invocation patterns
  Agents demonstrate continuous reasoning across turns; the bus is the sole communication substrate

  @primary @integration
  Scenario: A Stage 2 writer references its own prior reasoning in a later turn without re-reading files
    Given "tla-writer" is alive and has produced a first draft of the TLA spec
    And the Stage 3 moderator routes an objection back to "tla-writer"
    When "tla-writer" responds to the objection
    Then the response payload contains a bytestring that appears verbatim in at least one prior assistant event for the same session_id in event_log
    And event_log confirms the objection turn and the response turn share the same session_id with no new agent_sessions row for role="tla-writer" inserted between them

  @primary @integration
  Scenario: Stage 3 objection routing uses the existing Stage 2 agent process not a new spawn
    Given "bdd-writer" was spawned in Stage 2 with session_id "sess-bdd-01"
    And Stage 3 begins and the debate moderator emits an objection targeting "bdd-writer"
    When the router dispatches the objection
    Then the event is delivered to the process identified by session_id "sess-bdd-01"
    And agent_sessions shows no additional row with role="bdd-writer" created after Stage 2

  @primary @integration
  Scenario: Coding workers in Stage 7 remember previously attempted fixes in the same task
    Given a "coding-worker" agent for task "task-03" attempted a fix that did not resolve the test failure
    And the test handler returned a verify_result showing the fix was insufficient
    When the coding-worker responds to the second verify_result
    Then the payload references the previously attempted approach as already tried
    And event_log confirms the same session_id was used across both fix attempts for task "task-03"

# =============================================================================
# Item 22 — Test Doubles and Test Isolation Primitives
# =============================================================================

Feature: Test doubles for all external dependencies are available and test isolation is enforced
  No real claude, git, TLC, or database binaries are invoked from any test tier

  @primary @integration
  Scenario: claude-test-double.ps1 accepts and emits stream-json on stdin/stdout
    Given tests/helpers/claude-test-double.ps1 is started as a subprocess
    When a valid stream-json user message is written to its stdin
    Then it emits valid NDJSON on stdout including at least one assistant event and one result event
    And the result event includes total_tokens and duration_ms fields

  @primary @integration
  Scenario: claude-test-double.ps1 simulates multi-turn conversations without restarting
    Given claude-test-double.ps1 is running
    When a second user message is written to its stdin after the first result event
    Then it emits a second assistant event and result event
    And the process stays alive without restarting between turns

  @primary @integration
  Scenario: claude-test-double.ps1 accepts a configurable token-usage injection for checkpoint testing
    Given claude-test-double.ps1 is started with a token-usage configuration specifying total_tokens=90000
    When a user message is written to its stdin
    Then the result event's usage.total_tokens field equals 90000
    And this allows tests for Item 12 (checkpoint trigger) to inject specific token counts without a real model

  @primary @integration
  Scenario: git-test-double.ps1 handles git add, commit, diff cached, show, and log
    Given tests/helpers/git-test-double.ps1 is available
    When the test invokes git add followed by git commit via the test double
    Then the test double simulates a successful add and commit in its in-memory tree
    And git diff --cached returns the expected staged diff output
    And git log returns the expected commit history including Vibe-Event-Id trailers

  @primary @integration
  Scenario: TLC handler test double is available for handler unit tests
    Given tests/helpers/tlc-test-double.ps1 is available
    When the test invokes tlc-handler.ps1 with a verify payload targeting the test double
    Then the test double returns a configurable verify_result (pass or fail) without invoking the real TLC binary
    And the result is indistinguishable from a real verify_result envelope by the router

  @primary @integration
  Scenario: Tests handler test double is available for handler unit tests
    Given tests/helpers/tests-test-double.ps1 is available
    When the test invokes tests-handler.ps1 with a verify payload targeting the test double
    Then the test double returns a configurable verify_result without running real tests
    And the result conforms to the verify_result JSON schema

  @primary @integration
  Scenario: SQLite migration fixture creates a clean pre-migration database for each test
    Given the SQLite migration fixture is initialized for a test in tests/bus/integration/
    When the fixture creates the test database
    Then it contains the pre-migration tables (debate_state, stage_outputs, tier_progress, and core tables)
    And the fixture is isolated to that test and torn down after the test completes

  @primary @integration
  Scenario: Worktree fixture provides an isolated git worktree for each test
    Given the worktree fixture is initialized for a test in tests/bus/integration/
    When the fixture creates the test worktree
    Then it is a temporary directory with a valid .git structure isolated to that test
    And all git operations in that test use the fixture worktree, not the real repository

  @primary @integration
  Scenario: Integration tests use in-memory SQLite
    Given an integration test in tests/bus/integration/ runs
    When the test accesses the database
    Then it uses an in-memory SQLite connection
    And no on-disk .db file is created during the test

  @primary @integration
  Scenario: E2E tests use on-disk SQLite that is deleted at teardown
    Given an e2e test in tests/bus/e2e/ runs
    When the test completes (pass or fail)
    Then the on-disk SQLite file created for that test run is deleted
    And no test database persists between test runs

  @primary
  Scenario: No test at any tier invokes the real claude binary
    Given all test tiers (unit, integration, e2e, properties, traces) are running
    When any test requires a Claude agent interaction
    Then claude-test-double.ps1 is used instead of the real claude binary
    And no real claude process is spawned during any test

  @primary
  Scenario: No test at any tier shells out to the real TLC binary
    Given all test tiers (unit, integration, e2e, properties, traces) are running
    When any test triggers a TLC verification (verify event to="tlc")
    Then tlc-test-double.ps1 is invoked instead of the real tlc binary
    And no subprocess is spawned with an executable path matching the TLC binary (e.g., "tlc.jar", "tla2tools.jar", or "java" with a TLC classpath)
    And a test-suite-level assertion verifies that no process named "java" or "tlc" was spawned during the run
    And this rule is structurally identical to the claude-mock and git-mock rules: the test-double registry lists all three — claude, git, tlc — as mandatory mocks

  @primary
  Scenario: No test at any tier invokes real git commands against the working repository
    Given all test tiers are running
    When any test requires a git operation
    Then git-test-double.ps1 or the worktree fixture is used instead of real git
    And no real git commands run against the working repository

  @primary @integration
  Scenario: Each test uses a unique mutex naming prefix to prevent cross-test mutex collision
    Given the test suite runs multiple tests in parallel
    When each test creates a per-worktree mutex
    Then the mutex name includes a test-run-unique prefix (e.g., "VibeBusTest-<TestRunId>-<WorktreeName>")
    And no two parallel tests share a mutex name

  @primary @integration
  Scenario: The evt_id allocator is reset between tests
    Given two sequential unit tests both exercise the evt_id allocator
    When the second test starts
    Then the allocator returns "evt-001" as the first evt_id (not a continuation of the prior test's sequence)
    And no evt_id from the first test leaks into the second test's event_log rows

  @primary @integration
  Scenario: Test teardown asserts no leaked test-double processes remain after each test
    Given a test spawned claude-test-double.ps1 as a subprocess
    When the test completes (pass or fail)
    Then the teardown step verifies the test-double process has exited
    And if the process is still alive, teardown calls Stop-ProcessTree and the test is marked as having a cleanup warning
    And the working repository contains no test-double processes after the test suite finishes

  @primary @integration
  Scenario: Each test double is verified against the production contract it simulates
    Given the test-double registry enumerates: claude-test-double.ps1, git-test-double.ps1, tlc-test-double.ps1, tests-test-double.ps1
    When a contract-conformance test runs for each registered test double
    Then claude-test-double.ps1 emits NDJSON output that passes the same stream-json schema validation used in production
    And git-test-double.ps1 responds to all git subcommands exercised by the bus (add, commit, diff --cached, show, log) with output format-compatible with production git output
    And tlc-test-double.ps1 returns verify_result envelopes that pass the verify_result JSON schema
    And tests-test-double.ps1 returns verify_result envelopes that pass the verify_result JSON schema
    And this contract-conformance test runs in CI on every PR that modifies any test double, ensuring test-double output never drifts from the production schema

  @quality_attribute @integration
  Scenario: Mutation testing of router code measures property-test suite kill rate against a hash-pinned operator catalog
    Given the mutation test runner is configured to target bus/router/ source files
    And the CI job reads the mutation operators exclusively from tests/bus/mutation-operators.md at the SHA256 hash committed to tests/bus/mutation-operators.md.sha256 (the hash file is committed to the repository and the CI job fails if the computed hash of mutation-operators.md does not match the committed hash — this prevents silent catalog drift)
    And the mutation operators enumerated in tests/bus/mutation-operators.md include at minimum: boundary off-by-one (e.g., replace ">=" with ">" in threshold comparisons), guard negation (e.g., negate if-condition guards on routing rules), constant replacement (e.g., swap a named status string "routed" for "committed"), routing-rule inversion (e.g., flip allowed/disallowed for a (role, type) pair), halt-condition inversion (e.g., change a mechanical-halt branch to a no-op), schema-field removal (e.g., remove a required field from a payload schema check), and allocator-boundary shift (e.g., change evt_id exhaustion check from MaxValue-1 to MaxValue)
    When the mutation test suite applies each enumerated operator to bus/router/ and runs tests/bus/properties/ against each mutant
    Then at least 95% of injected mutants are killed by the property-test suite (project rule: "write tests, never add excludes" — 80% is insufficient)
    And surviving mutants are recorded in tests/bus/mutation-report.json with their location, applied operator name, and mutation description
    And the CI job fails if the kill rate drops below 95%
    And surviving mutants may only be documented as intentionally undetectable (and excluded from the kill-rate denominator) if they are structurally equivalent mutants (mutations that produce observationally identical behavior); escape-from-detection by weak tests is NOT grounds for exclusion
    And every documented known-gap surviving mutant in mutation-report.json must include a formal proof that the mutant is observationally equivalent — a comment like "test doesn't cover this" is not accepted
    And tests/bus/mutation-operators.md is the single source of truth for operator definitions; adding operators to the catalog (and updating the hash file) is required before they can be referenced in CI

# =============================================================================
# Item 23 — Log Interleaving Prevention
# =============================================================================

Feature: Write-PipelineLog uses a mutex to prevent concurrent log interleaving
  The heartbeat banner and event-log writes are serialized for multi-line atomicity

  @primary @integration
  Scenario: Concurrent event-log writes do not interleave lines
    Given multiple events are being routed concurrently by different runspaces
    When each event triggers a Write-PipelineLog call
    Then each log entry is written atomically
    And the Write-PipelineLog mutex serializes all writes to Console::Out and the log file

  @primary @integration
  Scenario: Heartbeat banner write is atomic despite concurrent event routing
    Given the heartbeat runspace fires while an event is being logged by the router
    When the heartbeat attempts to write its multi-line UTF-8 box
    Then the Write-PipelineLog mutex ensures the entire banner is written without interleaving
    And no heartbeat line appears between two lines of an event-log entry

# =============================================================================
# Item 24 — End-to-End Pipeline Flow with Bus
# =============================================================================

Feature: The full pipeline Stages 2-7 communicates exclusively via the bus
  Each stage's agents are spawned, exchange events, and are torn down per their logical scope

  @primary @integration
  Scenario: A complete pipeline run leaves no alive agents and produces the feature branch
    Given the pipeline started with seed "Build an auth module"
    And Stages 2 through 7 complete without error
    When the pipeline reaches semantic termination
    Then Stop-AllBusAgents is called
    And agent_sessions has zero rows with status="alive"
    And the feature branch is ready for PR

  @primary @integration
  Scenario: Stage 2 spawns writers as a group and waits for both to complete
    Given Stage 2 begins for feature "auth-flow"
    When Start-BusAgent is called for "tla-writer" and "bdd-writer" with a shared group_id
    Then Wait-BusGroup blocks until both emit done events
    And both artifacts (bdd.feature, TLA spec) are present on disk after the group resolves

  @primary @integration
  Scenario: Stage 3 routes objections to the already-running writer processes
    Given "tla-writer" and "bdd-writer" are alive from Stage 2
    And the Stage 3 debate moderator emits an objection targeting "tla-writer"
    When the router processes the objection
    Then the objection is routed to the existing "tla-writer" process (not a new spawn)
    And "tla-writer"'s session_id in agent_sessions is unchanged

  @primary @integration
  Scenario: Stage 7 coding workers and reviewers use per-task scoped agents
    Given Stage 7 has 4 tasks to dispatch
    When each task is dispatched
    Then Start-BusAgent spawns a fresh "coding-worker" for each task
    And a fresh "reviewer" is spawned for each task's review phase
    And each coding-worker is stopped after its task is merged
    And each reviewer is stopped after its review_verdict is received

  @primary @integration
  Scenario: Pipeline observable output after bus migration matches prior pipeline behavior
    Given the bus-backed pipeline completes for feature "auth-flow"
    When the pipeline reaches semantic termination
    Then the feature branch exists and is ready for PR
    And the downstream PR workflow operates on the branch without knowledge of the bus substrate

  @primary @integration
  Scenario: No feature flag gates the bus migration — cutover is a single atomic commit with no parallel code paths
    Given the bidirectional-comms migration commit has landed on the main branch
    When the pipeline source is inspected for feature flags, environment switches, or conditional Invoke-Claude fallback paths
    Then no runtime flag, environment variable, or configuration knob exists that would cause any Stage 2-7 code to use Invoke-Claude (non-interactive) instead of the bus
    And there is no parallel "legacy path" and "bus path" co-existing in the codebase
    And this is by design: the elicitor explicitly requires an atomic cutover rather than a phased rollout; this scenario documents that the no-feature-flag constraint is intentional and enforced

  @primary @integration
  Scenario: No canary deployment and no shadow mode — the bus subsystem has no traffic-shadowing capability by design
    Given the bus subsystem is fully deployed and operational
    When the system is inspected for shadow-mode, dark-launch, or traffic-splitting infrastructure
    Then no shadow mode, canary release path, or traffic mirroring mechanism exists in the bus subsystem
    And this is an explicit design decision documented in the elicitor: the pipeline runs entirely on the bus or not at all; partial-traffic experiments are out of scope
    And any PR that introduces shadow-mode infrastructure targeting Stages 2-7 is rejected by the "no-invoke-claude-regression" CI check as a regression

# =============================================================================
# Item 25 — Property-Based Tests (TLA+ Invariant Mapping)
# Each TLA+ safety invariant maps to a runtime property check in tests/bus/properties/
# =============================================================================

Feature: TLA+ safety invariants are verified at runtime as property-based tests
  tests/bus/properties/ contains one property test per named TLA+ invariant

  @primary @integration
  Scenario: NoDuplicateEvtId — no two event_log rows share an evt_id across any sequence
    Given a property test in tests/bus/properties/ runs the router with a random sequence of up to 500 events using the fixed seed stored under key "NoDuplicateEvtId" in tests/bus/properties/seeds.json
    When the sequence completes
    Then every evt_id in event_log is unique
    And the test fails (and reports the duplicate evt_id) if any evt_id appears more than once
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output

  @primary @integration
  Scenario: DeadAgentReceivesNoMessages — an agent with status ended receives no further stdin writes
    Given a property test spawns an agent, stops it via Stop-BusAgent, then attempts to route a random sequence of events to it using the fixed seed stored under key "DeadAgentReceivesNoMessages" in tests/bus/properties/seeds.json
    When Send-BusEvent is called targeting the stopped agent
    Then the router does not write to the stopped agent's stdin
    And the event is not appended to event_log with status="routed" for the stopped agent
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output

  @primary @integration
  Scenario: RatificationRequiresNoUnoverriddenObjections — consensus_ratified is never emitted while unresolved non-overridden objections exist
    Given a property test runs a simulated debate with a random objection, response, and override sequence using the fixed seed stored under key "RatificationRequiresNoUnoverriddenObjections" in tests/bus/properties/seeds.json
    When consensus_ratified is present in event_log
    Then every objection event with evt_id less than the consensus_ratified evt_id either has a matching objection_response in event_log or appears in the overridden set recorded by the router
    And the test fails if any unresolved, non-overridden objection precedes a consensus_ratified event
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output

  @primary @integration
  Scenario: EvtIdMonotone — evt_ids in event_log are strictly monotonically increasing
    Given a property test routes a random sequence of up to 500 events through the router using the fixed seed stored under key "EvtIdMonotone" in tests/bus/properties/seeds.json
    When event_log is read in insertion order
    Then each row's numeric evt_id is strictly greater than the previous row's numeric evt_id
    And the test fails if any row has an evt_id less than or equal to a prior row's evt_id
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output

  @primary @integration
  Scenario: SpawningAgentOnlyReceivesBootstrap — the first event delivered to a new agent is always of type bootstrap
    Given a property test spawns agents across random role and feature combinations using the fixed seed stored under key "SpawningAgentOnlyReceivesBootstrap" in tests/bus/properties/seeds.json
    When the first stdin message for each spawned agent is inspected
    Then the type field of the first message is always "bootstrap"
    And the test fails if any agent's first message has a type other than "bootstrap"
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output

  @negative @integration
  Scenario: SpawningAgentOnlyReceivesBootstrap — router halts if it attempts to deliver a non-bootstrap event to a still-spawning agent
    Given agent "tla-writer" has been spawned (Start-BusAgent called) but its agentStatus is still "spawning" (bootstrap has not yet been delivered and acknowledged)
    When the router attempts to deliver an event with type="ground_truth" to "tla-writer" before delivering the bootstrap event
    Then the router detects that "tla-writer" is in agentStatus="spawning" and the first pending event is not type="bootstrap"
    And the router halts with a mechanical error (failureCategory="group_violation" or a dedicated "spawn_order_violation" category) rather than delivering an out-of-order event
    And Stop-AllBusAgents is called
    And the error message identifies the agent, the attempted event type, and the required first-event type "bootstrap"
    And event_log records the attempted event as status="rejected" (not "routed")

  @primary @integration
  Scenario: OnlyDefinedHalts — the bus halts only for exactly the three defined halt categories
    Given a property test routes a random sequence of up to 500 events through the router using the fixed seed stored under key "OnlyDefinedHalts" in tests/bus/properties/seeds.json
    When a halt occurs during the sequence
    Then the halt category is one of: semantic_termination (exit 0; haltReason in {"consensus_ratified","consensus_failed","feature_complete","user_rollback"}), user_interrupt (exit 1), or mechanical_error (exit codes 10-16 per ExitCodeOf: duplicate_evt_id=10, group_violation=11, git_commit=12, handler_failure=13, sqlite_error=14, agent_crash=15, evt_id_overflow=16)
    And the test fails if any halt occurs without a recorded halt category matching one of these three values in the final event_log state
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): OnlyDefinedHalts is not a standalone named invariant. The equivalent guarantee
    # is expressed as a conjunction: halt transitions are RouterHaltsOnMechanicalError (exit codes 10–16),
    # RouterHaltsFeatureComplete, RouterRatifiesConsensus, RouterFailsConsensus, RouterExecutesRollback, and
    # UserInterrupts. v9 added RouterHaltsRollbackSqliteError (exit code 14, OBJ-11). v10 added
    # FIX-1/2/3 clearing failureCategory on RouterHaltsFeatureComplete, RouterRatifiesConsensus,
    # RouterFailsConsensus. v11 added RouterAbortsStaleRollback (NOT a halt — clears rollbackRequested while
    # bus stays halted; does not change haltReason/failureCategory/exit code).
    # Citation: BidirectionalComms.tla v11, halt-action group; HaltReasons constant; RouterAbortsStaleRollback.

  @primary @integration
  Scenario: CommitLockHolderAliveOrBusHalted — at most one agent holds the per-worktree commit lock at any point and the holder is always alive or the bus has halted
    Given a property test routes a random sequence of done events from multiple agents sharing the same worktree using the fixed seed stored under key "CommitLockHolderAliveOrBusHalted" in tests/bus/properties/seeds.json
    When the commit serializer processes each done event
    Then no two done events for the same worktree produce overlapping git commit operations (as evidenced by non-overlapping event_log committed timestamps)
    And whenever commitLockHolder is non-null in the observed state, that agent has status="alive" in agent_sessions or the bus has already entered a halted state
    And the test captures commit-start and commit-end times for each worktree and asserts no overlapping intervals exist for the same worktree
    And the test fails if any two commits for the same worktree have overlapping time intervals
    And the test fails if commitLockHolder is observed non-null for an agent with status="ended" while the bus is still running
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): CommitLockHolderAliveOrBusHalted is a named invariant introduced in
    # BidirectionalComms.tla v7 and carried forward unchanged to v11 (cfg line 153). This replaces the
    # v4 name CommitMutexHolds, which was a tautological restatement of TypeOK.
    # Citation: BidirectionalComms.tla v11, INVARIANT CommitLockHolderAliveOrBusHalted (cfg line 153).

  @primary @integration
  Scenario: ProtocolErrorIsNonTerminal — a protocol_error event never causes a halt; the pipeline continues
    Given a property test injects a random sequence of malformed envelopes, disallowed event types, and invalid payloads into the router using the fixed seed stored under key "ProtocolErrorIsNonTerminal" in tests/bus/properties/seeds.json
    When the router processes each invalid event
    Then every invalid event produces a protocol_error response to the sender
    And the pipeline status remains "running" (no halt) after each protocol_error
    And the test fails if any sequence of protocol_errors causes the bus to halt or reduce its alive agent count
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): ProtocolErrorIsNonTerminal is not a standalone named invariant. The guarantee
    # is expressed as the liveness property ProtocolErrorEventuallyResolved (temporal property) combined with
    # PendingProtocolErrorImpliesAgentAlive (safety invariant, cfg line 164). These ensure: a pending
    # protocol error exists only for alive agents and is always eventually resolved (by ack or crash → halt).
    # Citation: BidirectionalComms.tla v11, liveness properties + INVARIANT PendingProtocolErrorImpliesAgentAlive.

  @primary @integration
  Scenario: GroundTruthPrecedesAgentMessage — for every non-bootstrap inbound event to an agent, a ground_truth block is present in the same message
    Given a property test routes a random sequence of objection, verify, and done events to various agents using the fixed seed stored under key "GroundTruthPrecedesAgentMessage" in tests/bus/properties/seeds.json
    When the raw stdin content delivered to each agent is inspected
    Then every inbound JSON line whose type is not "bootstrap" contains an embedded ground_truth field
    And the test fails if any non-bootstrap inbound message lacks the ground_truth block
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): GroundTruthPrecedesAgentMessage is a named safety invariant (cfg line 157).
    # Asserts every non-bootstrap, non-ground_truth event TO an alive agent is preceded by a ground_truth event
    # in the same lifetime. Ground-truth injection operates at the PowerShell layer.
    # Citation: BidirectionalComms.tla v11, INVARIANT GroundTruthPrecedesAgentMessage (cfg line 157).

  @primary @integration
  Scenario: OverrideIntegrity — every consensus override carries a non-empty reason and enumerated evt_ids; no evt_id is overridden twice
    Given a property test runs a simulated debate with a random sequence of consensus_candidate events with override fields using the fixed seed stored under key "OverrideIntegrity" in tests/bus/properties/seeds.json
    When the router processes each consensus_candidate that includes an override field
    Then every override entry in event_log contains: a non-empty reason string, a non-empty array of overridden evt_ids, and the overriding session_id
    And no evt_id appears in two separate override entries across the entire event_log sequence
    And the test fails if any override entry has an empty reason, an empty evt_ids array, or a missing session_id
    And the test fails if any evt_id is overridden more than once across the sequence
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): OverrideIntegrity is a named invariant.
    # Citation: BidirectionalComms.tla v11, INVARIANT OverrideIntegrity (cfg line 158).

  @edge_case @integration
  Scenario: OverrideIntegrity — a second override attempt for the same evt_id within one debate is rejected idempotently as a duplicate
    Given the moderator overrode objection evt-031 in round 3 with a non-empty reason "design trade-off accepted"
    And the override record for evt-031 is stored in event_log
    And a crash-and-resume cycle occurs, causing the moderator to re-enter the same consensus sequence
    When the re-spawned moderator submits a new consensus_candidate that includes an override field again listing evt-031
    Then the router detects that evt-031 already has an override entry in event_log from the same or prior session
    And the router emits a protocol_error to the moderator identifying "evt-031 already overridden — duplicate override attempt rejected"
    And the second override record for evt-031 is NOT appended to event_log
    And the existing override record from round 3 remains intact with its original reason and session_id
    And the pipeline does not halt — the duplicate-override rejection is a protocol_error, not a mechanical error

  @primary @integration
  Scenario: CommitIdempotency — the same done event cannot produce more than one git commit carrying its evt_id
    Given a property test routes a random sequence of done events through the commit serializer, including sequences where -Resume re-delivers events, using the fixed seed stored under key "CommitIdempotency" in tests/bus/properties/seeds.json
    When git log is inspected across the full sequence including any resume cycles
    Then no Vibe-Event-Id trailer value appears more than once in git history for the worktree under test
    And every done event with status="committed" in event_log has exactly one corresponding git commit carrying its evt_id as a trailer
    And the test fails if any evt_id appears in two separate git commits
    And the test fails if a done event with status="committed" has no corresponding git commit
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): CommitIdempotency is a named invariant.
    # Citation: BidirectionalComms.tla v11, INVARIANT CommitIdempotency (cfg line 159).

  @failure_recovery @edge_case
  Scenario: CommitIdempotency — partial commit (git succeeded but event_log write failed) followed by retry produces exactly one commit
    Given the commit serializer for worktree "wt-auth-flow" completed a git commit for evt-055 (git exit code 0)
    And the subsequent event_log status update to "committed" failed (SQLite write error — bus halted)
    And the bus was halted and resumed via -Resume
    When -Resume detects the partial commit state (git has the commit, event_log row has status="routed" not "committed")
    Then -Resume reconciles by querying git log for "Vibe-Event-Id: evt-055" and finding the commit present
    And -Resume updates the event_log row for evt-055 to status="committed" (synthetic reconciliation) without re-running git commit
    And the git worktree contains exactly one commit carrying "Vibe-Event-Id: evt-055" (no duplicate commit)
    And event_log contains exactly one row for evt-055 with status="committed" after reconciliation

  @primary @integration
  Scenario: AllGroupRepliesHaveSentEvents — every agent in groupReplies for a group has a matching event record in event_log bearing that group_id
    Given a property test creates groups with defined memberships and routes a random sequence of events using the fixed seed stored under key "AllGroupRepliesHaveSentEvents" in tests/bus/properties/seeds.json
    When the router records an agent as having replied to a group (adds it to groupReplies[g])
    Then event_log contains at least one event with from=<that agent> and groupId=<that group's group_id>
    And the test inspects event_log independently of groupReplies to verify the match — it does NOT rely solely on the AgentSendsToGroup guard (which would make the check tautological)
    And any event from a non-member bearing a group_id is treated as a group invariant violation and triggers a mechanical halt
    And the test fails if any agent appears in groupReplies[g] without a corresponding event_log record
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): AllGroupRepliesHaveSentEvents replaced NoNonMemberGroupReply (v5r5).
    # Checks event_log independently, making the check non-tautological.
    # Citation: BidirectionalComms.tla v11, INVARIANT AllGroupRepliesHaveSentEvents (cfg line 160).

  @edge_case @integration
  Scenario: AllGroupRepliesHaveSentEvents — stale group_id reply from an agent that has since died is detected as a group invariant violation
    Given a group "grp-stage2" contains members "tla-writer" and "bdd-writer"
    And "tla-writer" sent a valid done event with group_id="grp-stage2" (recorded in groupReplies[grp-stage2])
    And "tla-writer" then crashed and its agent_sessions row was updated to status="ended"
    When a second message arrives on the bus with from="tla-writer" and group_id="grp-stage2" (a stale reply emitted by the dying process before EOF was detected)
    Then the router detects that "tla-writer" already appears in groupReplies[grp-stage2] (duplicate reply from a dead agent)
    And the router treats this as a group invariant violation and halts with a mechanical error (failureCategory="group_violation")
    And the stale event is logged in event_log with status="rejected" (not "routed")
    And the existing valid groupReplies entry for "tla-writer" is preserved in the event_log audit trail

  @primary @integration
  Scenario: ExactlyOneBootstrapPerLifetime — each agent receives at most one bootstrap per lifetime epoch and exactly one once alive
    Given a property test spawns agents across random role, checkpoint, and resume sequences using the fixed seed stored under key "ExactlyOneBootstrapPerLifetime" in tests/bus/properties/seeds.json
    When the test inspects event_log for each agent across all lifetime epochs (indexed by spawnedAtEvt)
    Then for each agent and each lifetime epoch, event_log contains at most one bootstrap event with evt_id >= that epoch's spawnedAtEvt
    And for any agent whose status has advanced past spawning (alive or checkpointing), exactly one bootstrap event exists for its current epoch
    And the test fails if any agent receives two bootstrap events in the same lifetime epoch or zero bootstrap events after reaching alive status
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): ExactlyOneBootstrapPerLifetime is a named invariant introduced in v7 and
    # carried forward unchanged to v11 (cfg line 156).
    # Citation: BidirectionalComms.tla v11, INVARIANT ExactlyOneBootstrapPerLifetime (cfg line 156).

  @primary @integration
  Scenario: ConsensusEventsRoutedThroughBus — no consensus event is ever addressed to or emitted by a native handler
    Given a property test routes a random mix of consensus and non-consensus events using the fixed seed stored under key "ConsensusEventsRoutedThroughBus" in tests/bus/properties/seeds.json
    When event_log is inspected for events with type in {objection, objection_response, consensus_candidate, consensus_ratified, consensus_failed}
    Then no such event has to="tlc", to="tests", or to="git"
    And no such event has from="tlc", from="tests", or from="git"
    And the test fails if any consensus event references a handler as sender or recipient
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): ConsensusEventsRoutedThroughBus is a named invariant introduced in v7 and
    # carried forward unchanged to v11 (cfg line 162).
    # Citation: BidirectionalComms.tla v11, INVARIANT ConsensusEventsRoutedThroughBus (cfg line 162).

  @primary @integration
  Scenario: CandidateHasEventInLog — every consensus_candidate event in the router's internal state has a matching record in event_log from within the current consensus epoch
    Given a property test runs a simulated debate with a random objection/response/candidate sequence using the fixed seed stored under key "CandidateHasEventInLog" in tests/bus/properties/seeds.json
    When the router's internal consensusState reaches "candidate"
    Then event_log contains at least one event with type="consensus_candidate" whose evt_id is greater than or equal to the consensus-round epoch marker (consensusRoundStart) — stale candidates from prior rollback rounds are excluded
    And the test verifies the epoch-scoped predicate: ∀ consensusState="candidate" ⇒ ∃ e ∈ eventLog : e.type="consensus_candidate" ∧ e.evt_id >= consensusRoundStart
    And the epoch used is consensusRoundStart (the consensus-round epoch, advanced on rollback), NOT spawnedAtEvt[a] (the agent-lifetime epoch, advanced on agent respawn) — the two epochs have distinct semantics: agent lifetime resets on respawn; consensus round resets on rollback
    And the test fails if consensusState="candidate" is observed without a scoped matching event_log entry with evt_id >= consensusRoundStart
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): CandidateHasEventInLog is a named invariant (cfg line 165). It is epoch-scoped
    # to consensusRoundStart (v11 OBJ-A), not spawnedAtEvt. This is a critical distinction: spawnedAtEvt is
    # an agent-lifetime epoch (reset on respawn); consensusRoundStart is a consensus-round epoch (reset on
    # RouterExecutesRollback or RouterHaltsRollbackSqliteError). Using the wrong epoch would allow pre-rollback
    # consensus_candidate events to satisfy the invariant in post-rollback rounds.
    # RatificationViaConsensusProtocol (v7) was retired as vacuous.
    # Citation: BidirectionalComms.tla v11, INVARIANT CandidateHasEventInLog (cfg line 165).

  @primary @integration
  Scenario: BusRunningImpliesLockHeld — the bus never enters "running" or "resuming" state while pipeline_lock is FALSE
    Given a property test exercises bus start, halt, resume, and semantic-termination cycles using the fixed seed stored under key "BusRunningImpliesLockHeld" in tests/bus/properties/seeds.json
    When the test samples busStatus at each transition
    Then whenever busStatus is "running" or "resuming", pipeline_lock is TRUE in the SQLite pipeline_lock table
    And whenever busStatus transitions to "halted" due to semantic termination (consensus_ratified, consensus_failed, feature_complete), the pipeline_lock is subsequently released
    And the test fails if busStatus="running" is ever observed with pipeline_lock=FALSE
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): BusRunningImpliesLockHeld is a named invariant (OBJ-5/v6 lineage).
    # Citation: BidirectionalComms.tla v11, INVARIANT BusRunningImpliesLockHeld (cfg line 161).

  @negative @integration
  Scenario: BusRunningImpliesLockHeld — bus halts with mechanical error if pipeline_lock is released while busStatus is still running
    Given the bus is running (busStatus="running") and pipeline_lock is TRUE
    And an implementation defect or external process releases the pipeline_lock row while the router has not yet transitioned to "halted"
    When the router's lock-monitor detects that pipeline_lock is FALSE while busStatus="running"
    Then the router halts with a mechanical error (failureCategory="sqlite_error" — the lock table is a SQLite concern)
    And Stop-AllBusAgents is called
    And the error message identifies "pipeline_lock released while bus running" as the cause
    And the process exits with exit code 14 (sqlite_error category per ExitCodeOf)
    And no further events are routed after the lock is detected as absent

  @primary @integration
  Scenario: MechanicalHaltHasCategory — whenever the bus halts with haltReason="mechanical_error", failureCategory is always a member of FailureCategories; and whenever haltReason is semantic, failureCategory is null
    Given a property test routes a random sequence of up to 500 events through the router using the fixed seed stored under key "MechanicalHaltHasCategory" in tests/bus/properties/seeds.json
    When the router halts and haltReason="mechanical_error" is observed in the final bus state
    Then failureCategory is non-null and is a member of the FailureCategories set: {duplicate_evt_id, group_violation, git_commit, handler_failure, sqlite_error, agent_crash, evt_id_overflow}
    And the state predicate busStatus="halted" ∧ haltReason="mechanical_error" ⇒ failureCategory ∈ FailureCategories holds across the entire property sequence
    And the test fails if any halted state with haltReason="mechanical_error" has failureCategory=null or failureCategory outside FailureCategories
    And the test verifies the bidirectional (v9 OBJ-15) direction: haltReason ≠ "mechanical_error" ⇒ failureCategory = null — semantic halts (haltReason ∈ {"consensus_ratified","consensus_failed","feature_complete","user_rollback"}) and user_interrupt (haltReason="user_interrupt") always have failureCategory=null
    And the test explicitly exercises the v10 post-resume-cycle case: a mechanical halt with non-null failureCategory followed by -Resume and a semantic halt must leave failureCategory=null at the semantic halt (FIX-1/2/3(v10))
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): MechanicalHaltHasCategory is a NAMED INVARIANT (cfg line 163). v9 OBJ-15
    # strengthened it to a bidirectional check: haltReason="mechanical_error" ↔ failureCategory≠NULL.
    # v10 FIX-1/2/3 patched RouterHaltsFeatureComplete, RouterRatifiesConsensus, RouterFailsConsensus
    # to clear failureCategory (was UNCHANGED), closing a stale-carry-over bug post-resume.
    # Citation: BidirectionalComms.tla v11, INVARIANT MechanicalHaltHasCategory (cfg line 163).

  @primary @integration
  Scenario: PendingProtocolErrorImpliesAgentAlive — while the bus is running, a pending protocol error exists only for an agent with status alive
    Given a property test injects protocol_error events and checkpoint/crash sequences using the fixed seed stored under key "PendingProtocolErrorImpliesAgentAlive" in tests/bus/properties/seeds.json
    When the test samples the pending-protocol-error flag for each agent at each router transition while busStatus="running"
    Then whenever an agent's pendingProtocolError flag is TRUE, that agent's status is "alive" in agent_sessions
    And the test verifies that RouterInitiatesCheckpoint is never observed while pendingProtocolError=TRUE for the checkpointing agent (the hotfix guard from TLA+ v8)
    And the test fails if pendingProtocolError=TRUE is observed for any agent with status other than "alive" while the bus is running
    And the test explicitly covers the corner case where an agent crashes (exits) while pendingProtocolError=TRUE — the router must atomically clear the pending flag and transition to mechanical halt in the same action; the flag must never remain TRUE after the crash is recorded in agent_sessions
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): PendingProtocolErrorImpliesAgentAlive is a named invariant (cfg line 164).
    # Agent dying while pending: crash action atomically clears pendingProtocolError AND transitions to halted.
    # Paired with liveness: ProtocolErrorEventuallyResolved (temporal property).
    # Citation: BidirectionalComms.tla v11, INVARIANT PendingProtocolErrorImpliesAgentAlive (cfg line 164).

  @primary @integration
  Scenario Outline: TypeOK — all router state variables remain within their declared TLA+ v11 type domains throughout a run
    Given a property test routes a random sequence of up to 1000 events through the router using the fixed seed stored under key "TypeOK_<facet>" in tests/bus/properties/seeds.json
    When the test samples router state after each transition
    Then the state variable <variable> is always within its declared domain <domain>

    Examples:
      | facet                    | variable                     | domain                                                                                                    |
      | nextEvtId                | nextEvtId                    | positive integer (1..MaxEvtId+1)                                                                         |
      | agentStatus              | agentStatus[a] per agent     | {"spawning","alive","checkpointing","renewing","dead"}                                                   |
      | busStatus                | busStatus                    | {"running","halted","resuming"}                                                                           |
      | haltReason               | haltReason                   | {"consensus_ratified","consensus_failed","feature_complete","mechanical_error","user_interrupt","user_rollback"} or null |
      | failureCategory          | failureCategory              | {"duplicate_evt_id","group_violation","git_commit","handler_failure","sqlite_error","agent_crash","evt_id_overflow"} or null |
      | handlerState             | handlerState[h] per handler  | {"idle","busy"}                                                                                           |
      | pipeline_lock            | pipeline_lock                | boolean                                                                                                   |
      | rollbackTargetWorktree   | rollbackTargetWorktree       | Worktrees ∪ {NULL} — added v9 OBJ-4                                                                      |
      | handlerPendingEpoch      | handlerPendingEpoch[h]       | 1..MaxEvtId+1 ∪ {NULL} per handler — added v9 OBJ-9                                                    |
      | consensusRoundStart      | consensusRoundStart          | 1..(MaxEvtId+1) — added v11 OBJ-A; epoch boundary for consensus events; advanced by rollback actions   |
    # TLA+ traceability (v11): TypeOK is the master type invariant. v9 added rollbackTargetWorktree
    # (Worktrees ∪ {NULL}) and handlerPendingEpoch ([Handlers -> 1..MaxEvtId+1 ∪ {NULL}]) to TypeOK's domain.
    # v11 OBJ-A added consensusRoundStart (1..(MaxEvtId+1)) as a consensus-round epoch boundary marker.
    # Citation: BidirectionalComms.tla v11, TypeOK predicate (cfg line 146).

  @primary @integration
  Scenario: AgentsEventuallyAlive liveness — every spawning agent eventually becomes alive or the bus halts
    Given a property test spawns agents and verifies progress using the fixed seed stored under key "AgentsEventuallyAlive" in tests/bus/properties/seeds.json
    When any agent enters spawning status
    Then that agent eventually transitions to "alive" status or the bus transitions to "halted"
    And the test fails if an agent remains in "spawning" status for more than the configured liveness-check timeout (default: 30 router transitions) without the bus halting
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): AgentsEventuallyAlive is a liveness property (temporal, ~>) introduced in v7.
    # Citation: BidirectionalComms.tla v11, PROPERTY AgentsEventuallyAlive (cfg line 172); WF_vars(DeliverBootstrap).

  @primary @integration
  Scenario: CandidateEventuallyResolves liveness — a consensus candidate always resolves or the bus halts
    Given a property test drives debates through random objection/response/candidate sequences using the fixed seed stored under key "CandidateEventuallyResolves" in tests/bus/properties/seeds.json
    When consensusState reaches "candidate"
    Then consensusState eventually transitions to "ratified" or "failed", or busStatus transitions to "halted"
    And the test fails if consensusState remains "candidate" indefinitely (more than the configured liveness-check timeout router transitions) without resolution or halt
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): CandidateEventuallyResolves is a liveness property introduced in v7.
    # Citation: BidirectionalComms.tla v11, PROPERTY CandidateEventuallyResolves (cfg line 173);
    # Fairness WF_vars(RouterRatifiesConsensus), WF_vars(RouterFailsConsensus).

  @primary @integration
  Scenario: CommitLockEventuallyReleased liveness — a held commit lock is eventually released or the bus halts
    Given a property test routes done events and simulates commit completion/failure sequences using the fixed seed stored under key "CommitLockEventuallyReleased" in tests/bus/properties/seeds.json
    When a worktree's commitLockHolder becomes non-null
    Then commitLockHolder for that worktree eventually returns to null or busStatus transitions to "halted"
    And the test fails if commitLockHolder remains non-null indefinitely without resolution or halt
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): CommitLockEventuallyReleased is a liveness property introduced in v7.
    # Citation: BidirectionalComms.tla v11, PROPERTY CommitLockEventuallyReleased (cfg line 174);
    # Fairness SF_vars(RouterCommitSucceeds).

  @primary @integration
  Scenario: ProtocolErrorEventuallyResolved liveness — a pending protocol error is eventually cleared or the bus halts
    Given a property test injects protocol_error events and drives agent responses using the fixed seed stored under key "ProtocolErrorEventuallyResolved" in tests/bus/properties/seeds.json
    When an agent's pendingProtocolError flag becomes TRUE
    Then that flag eventually becomes FALSE (via protocol_error_ack) or busStatus transitions to "halted"
    And the test fails if pendingProtocolError remains TRUE indefinitely without the bus halting
    And the test verifies that the flag is cleared either by AgentEmitsAfterProtocolError (self-correction) or by AgentCrashes (mechanical halt)
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): ProtocolErrorEventuallyResolved is a liveness property introduced in v7.
    # Paired safety invariant: PendingProtocolErrorImpliesAgentAlive (cfg line 164).
    # Citation: BidirectionalComms.tla v11, PROPERTY ProtocolErrorEventuallyResolved (cfg line 175);
    # Fairness WF_vars(AgentEmitsAfterProtocolError).

  @primary @integration
  Scenario: WF-SF fairness asymmetry — RouterCommitSucceeds (SF) prevents commit-lock starvation; AgentSendsDone (WF) sufficient for uncontended acquisition
    Given a property test simulates 8 agents competing to acquire the same worktree commit lock using the fixed seed stored under key "FairnessAsymmetry" in tests/bus/properties/seeds.json
    When the test runs until every competing agent has attempted lock acquisition at least 10 times
    Then every agent that reaches the LockFree-enabled state eventually acquires and releases the commit lock (WF sufficiency for AgentSendsDone)
    And no single agent acquires the commit lock on every consecutive turn while other agents are waiting (SF requirement for RouterCommitSucceeds — starvation prevention)
    And the test records the maximum consecutive-lock-acquisition count for any single agent across the sequence
    And the test fails if any agent's consecutive-lock-acquisition count equals the total number of lock acquisitions
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): WF/SF asymmetry documented in OBJ-5 / OBJ-4(v6) Fairness section.
    # Citation: BidirectionalComms.tla v11, Fairness clause; SF_vars(RouterCommitSucceeds) vs WF_vars(AgentSendsDone).

  @primary @integration
  Scenario: WF_vars(UserRequestsRollback(w)) fairness — under enabling conditions, rollback request surfaces eventually
    Given a property test runs the router in a state where rollbackRequested=FALSE and a valid snapshot exists for worktree "wt1" using the fixed seed stored under key "WF_UserRequestsRollback" in tests/bus/properties/seeds.json
    And the bus is running (BusRunning holds) and no snapshot-blocking condition is active
    When the test runs for sufficient router transitions for the WF condition to discharge
    Then a UserRequestsRollback(wt1) action eventually fires (rollbackRequested transitions from FALSE to TRUE)
    And the test fails if UserRequestsRollback(wt1) never fires despite its enabling condition holding continuously (more than the configured liveness-check timeout)
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): WF_vars(UserRequestsRollback(w)) added in v9 OBJ-12.
    # Citation: BidirectionalComms.tla v11, Fairness clause WF_vars(UserRequestsRollback(w)).

  @primary @integration
  Scenario: WF_vars(RouterTakesSnapshot(w)) fairness — when snapshot-taking is enabled and no halt is pending, a snapshot eventually occurs
    Given a property test runs the router with no rollback pending, no halt condition, and snapshot-taking allowed for worktree "wt1" using the fixed seed stored under key "WF_RouterTakesSnapshot" in tests/bus/properties/seeds.json
    And the ~rollbackRequested guard (OBJ-3(v9)) is satisfied — rollbackRequested=FALSE
    When the test runs for sufficient router transitions for the WF condition to discharge
    Then RouterTakesSnapshot(wt1) eventually fires (snapshotExists[wt1] transitions to TRUE)
    And the test fails if RouterTakesSnapshot(wt1) never fires despite its enabling condition holding continuously
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): WF_vars(RouterTakesSnapshot(w)) added in v9 OBJ-13.
    # Citation: BidirectionalComms.tla v11, Fairness clause WF_vars(RouterTakesSnapshot(w)).

  # ---------------------------------------------------------------------------
  # v8 NEW INVARIANTS (OBJ-5 through OBJ-10) — zero BDD coverage in prior round
  # ---------------------------------------------------------------------------

  @primary @integration
  Scenario: TypeSenderACL — no agent emits an event type forbidden for its role; ACL violations are rejected before append (from-side)
    Given a property test routes a random sequence of events covering all (role, type) pairs using the fixed seed stored under key "TypeSenderACL_from" in tests/bus/properties/seeds.json
    When every outbound envelope is validated by the router before appending to event_log
    Then no event in event_log has a (from-role, type) pair that violates the TypeSenderACL rule table
    And for every rejected (role, type) pair, the router emits a protocol_error to the sender rather than a halt
    And specifically: a tla-writer constructing an envelope with type="consensus_ratified" is rejected before append because "consensus_ratified" is a router-only emit type
    And specifically: a handler (tlc, tests, git) constructing an envelope with type="done" is rejected because handlers may only emit "verify_result"
    And specifically: a debate-moderator constructing an envelope with type="bootstrap" is rejected because bootstrap is a router-to-agent type only
    And the test fails if any event_log row with status="routed" has a from field whose role is forbidden from emitting the event type
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): TypeSenderACL is a NAMED INVARIANT (cfg line 166). v9 OBJ-5 extended it to
    # include recipient-side (to-side) constraints — see TypeSenderACL_to scenario below.
    # Citation: BidirectionalComms.tla v11, INVARIANT TypeSenderACL (cfg line 166).

  @negative @integration
  Scenario Outline: TypeSenderACL — recipient-side (to-side) constraints reject envelopes addressed to invalid targets (v9 OBJ-5)
    Given a property test routes envelopes with type "<type>" addressed to "<invalid_recipient>" using the fixed seed stored under key "TypeSenderACL_to_<type>" in tests/bus/properties/seeds.json
    When the router validates the envelope's to-field against the TypeSenderACL recipient partition
    Then the router rejects the envelope with a protocol_error identifying "<invalid_recipient>" as an invalid recipient for type "<type>"
    And no rejected envelope is appended to event_log with status="routed"
    And the pipeline does not halt — recipient ACL violations are protocol_error, not mechanical error
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output

    Examples:
      | type                  | invalid_recipient       | reason                                                       |
      | bootstrap             | handler ("tlc")         | bootstrap/ground_truth/checkpoint/protocol_error/verify_result/review_verdict addressed only to Agents |
      | ground_truth          | handler ("tests")       | ground_truth is router-to-agent only                        |
      | checkpoint            | handler ("git")         | checkpoint is router-to-agent only                          |
      | protocol_error        | handler ("tlc")         | protocol_error is router-to-agent only                      |
      | verify_result         | handler ("git")         | verify_result is handler-to-agent, not handler-to-handler   |
      | review_verdict        | handler ("tlc")         | review_verdict is agent-to-agent, not agent-to-handler      |
      | done                  | agent ("tla-writer")    | done/objection/consensus_candidate/checkpoint_response/protocol_error_ack addressed only to "router" |
      | objection             | agent ("bdd-writer")    | objection must go to "router"                               |
      | consensus_candidate   | agent ("tla-writer")    | consensus_candidate must go to "router"                     |
      | checkpoint_response   | agent ("debate-mod")    | checkpoint_response must go to "router"                     |
      | consensus_ratified    | agent ("tla-writer")    | consensus_ratified/consensus_failed addressed only to "broadcast" |
      | consensus_failed      | agent ("bdd-writer")    | consensus_failed must go to "broadcast"                     |
      | verify                | agent ("tla-writer")    | verify addressed only to Handlers                           |
      | review_requested      | handler ("tests")       | review_requested addressed only to Agents or "broadcast"   |

  @primary @integration
  Scenario: HandlerStateConsistency — handler request fields idle when handler is idle, all populated when busy (v9 tri-field biconditional)
    Given a property test routes a random sequence of verify events, verify_result events, and handler failures using the fixed seed stored under key "HandlerStateConsistency" in tests/bus/properties/seeds.json
    When the test samples handlerState, handlerPendingAgent, handlerPendingEvt, and handlerPendingEpoch for each handler at every router transition
    Then for every handler h: (handlerPendingAgent[h] = null) = (handlerPendingEvt[h] = null) = (handlerPendingEpoch[h] = null) holds at every transition (tri-field biconditional — v9 OBJ-9 extended to include epoch)
    And whenever handlerState[h]="idle", all three fields (handlerPendingAgent[h], handlerPendingEvt[h], handlerPendingEpoch[h]) are null
    And whenever handlerState[h]="busy", all three fields are non-null
    And when an agent crashes mid-handler-invocation (AgentCrashes fires with handlerPendingAgent[h]=a), all three fields are atomically cleared to null and handlerState[h] returns to "idle"
    And the test fails if any transition leaves any one of the three fields non-null while the others are null
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): HandlerStateConsistency is a NAMED INVARIANT (cfg line 167). v9 OBJ-9 added
    # handlerPendingEpoch to the biconditional, extending the pair equality to a triple.
    # Citation: BidirectionalComms.tla v11, INVARIANT HandlerStateConsistency (cfg line 167).

  @negative @integration
  Scenario: Handler epoch mismatch — HandlerAdapterCompletes rejects a stale completion after agent respawn
    Given agent "tla-writer" was alive with spawnedAtEvt="evt-010" and sent a verify event to handler "tlc"
    And handlerPendingAgent["tlc"]="tla-writer" and handlerPendingEpoch["tlc"]="evt-010" were recorded at dispatch time
    And "tla-writer" crashed before the TLC invocation completed
    And -Resume re-spawned "tla-writer" as a new process with spawnedAtEvt="evt-025" (new agent-lifetime epoch)
    When the TLC invocation completes and HandlerAdapterCompletes fires with handlerPendingEpoch["tlc"]="evt-010"
    Then the router checks spawnedAtEvt for the current "tla-writer" agent ("evt-025") against handlerPendingEpoch["tlc"] ("evt-010")
    And the epoch guard rejects the completion because spawnedAtEvt[a] ("evt-025") ≠ handlerPendingEpoch[h] ("evt-010")
    And the stale verify_result is NOT delivered to the re-spawned "tla-writer"
    And the handler state for "tlc" is cleared atomically: handlerPendingAgent["tlc"]=null, handlerPendingEvt["tlc"]=null, handlerPendingEpoch["tlc"]=null, handlerState["tlc"]="idle"
    And the router halts with a mechanical error (epoch mismatch indicates a dangling handler request from a prior agent lifetime)
    And Stop-AllBusAgents is called

  @primary @integration
  Scenario: RollbackRequiresSnapshot — a rollback can only be executed when at least one snapshot exists for the target worktree
    Given a property test exercises rollback sequences with and without prior snapshots using the fixed seed stored under key "RollbackRequiresSnapshot" in tests/bus/properties/seeds.json
    When the test observes rollbackRequested=TRUE in the router state
    Then RouterExecutesRollback fires only if snapshotExists[wt]=TRUE for the worktree associated with the rollback target (worktree-scoped pre-condition)
    And if no snapshot exists for the target worktree, the rollback attempt is rejected with a defined error rather than silently proceeding on a snapshot from a different worktree
    And the test verifies the invariant ∀ state: rollbackRequested=TRUE ∧ snapshotExists[targetWorktree]=FALSE ⇒ RouterExecutesRollback does not fire
    And the test fails if rollback fires without a matching worktree-scoped snapshot
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): RollbackRequiresSnapshot is a NAMED INVARIANT (cfg line 168). v9 OBJ-4 added
    # rollbackTargetWorktree: the invariant now checks snapshotExists[rollbackTargetWorktree] specifically
    # rather than a feature-wide snapshot flag.
    # Citation: BidirectionalComms.tla v11, INVARIANT RollbackRequiresSnapshot (cfg line 168); v9 OBJ-4.

  @primary @integration
  Scenario: RollbackEventuallyCompletes liveness — once rollback is requested, it eventually completes or the bus halts for an unrelated mechanical reason
    Given a property test requests a rollback (rollbackRequested=TRUE) while a valid worktree-scoped snapshot exists using the fixed seed stored under key "RollbackEventuallyCompletes" in tests/bus/properties/seeds.json
    And fairness assumption WF_vars(RouterExecutesRollback) is active — the router is not blocked by a live mechanical error or concurrent in-flight commit
    When the test runs for sufficient router transitions for the WF condition to discharge
    Then rollbackRequested eventually becomes FALSE (rollback completed) or busStatus becomes "halted" from an unrelated mechanical error
    And the test fails if rollbackRequested remains TRUE indefinitely without completion or halt (more than the configured liveness-check timeout)
    And the test explicitly verifies that a pending commit (commitLockHolder[wt] non-null) does not permanently block rollback — the rollback proceeds once the commit completes
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): RollbackEventuallyCompletes is a NAMED LIVENESS PROPERTY (cfg line 176).
    # v9 OBJ-1 added the BusRunning guard to RouterExecutesRollback, ensuring it cannot fire while halted.
    # v9 OBJ-8 added the commit-drain guard (\A w: commitLockHolder[w]=NULL) to RouterExecutesRollback.
    # v11 OBJ-C: RouterAbortsStaleRollback handles the halted+rollbackRequested case so RollbackEventuallyCompletes
    # does not hold vacuously when Ctrl+C interrupts a pending rollback.
    # Fairness: WF_vars(RouterExecutesRollback); WF_vars(RouterAbortsStaleRollback).
    # Citation: BidirectionalComms.tla v11, PROPERTY RollbackEventuallyCompletes (cfg line 176).

  # ---------------------------------------------------------------------------
  # v9 NEW INVARIANT: NoOrphanedHandlerForDeadAgent (OBJ-6(v9), cfg line 169)
  # ---------------------------------------------------------------------------

  @primary @integration
  Scenario: NoOrphanedHandlerForDeadAgent — no handler remains pending for a dead agent
    Given a property test routes a random sequence of verify events, agent crashes, and handler completions using the fixed seed stored under key "NoOrphanedHandlerForDeadAgent" in tests/bus/properties/seeds.json
    When the test observes agentStatus[a]="dead" for any agent a in the router state
    Then for every handler h in Handlers: handlerPendingAgent[h] ≠ a — no handler retains a pending-agent reference to the dead agent
    And the state predicate agentStatus[a]="dead" ⇒ ∀ h ∈ Handlers : handlerPendingAgent[h] ≠ a holds at every transition
    And the test verifies that AgentCrashes atomically clears handlerPendingAgent[h]=null, handlerPendingEvt[h]=null, handlerPendingEpoch[h]=null for any handler h where handlerPendingAgent[h]=a at the time of crash
    And the test fails if any handler's handlerPendingAgent field references an agent with status="dead"
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): NoOrphanedHandlerForDeadAgent is a NAMED INVARIANT added in v9 OBJ-6 (cfg line 169).
    # Ensures handler-adapter cleanup is atomic with agent-death. Belt-and-suspenders with HandlerStateConsistency.
    # Citation: BidirectionalComms.tla v11, INVARIANT NoOrphanedHandlerForDeadAgent (cfg line 169).

  # ---------------------------------------------------------------------------
  # RouterHaltsRollbackSqliteError — v9 new halt action (OBJ-11(v9)), extended v11 OBJ-EC-3 + OBJ-A
  # ---------------------------------------------------------------------------

  @primary @integration
  Scenario: RouterHaltsRollbackSqliteError — SQLite error during rollback execution halts the bus with sqlite_error and resets the ConsensusRound aggregate
    Given the bus is running (busStatus="running") with rollbackRequested=TRUE and rollbackTargetWorktree="wt-auth-flow"
    And consensusState="open", unresolvedObjections={"evt-031"}, overriddenObjections=∅ (pre-halt consensus state)
    And a SQLite error occurs during the rollback execution sequence (e.g., locked database or constraint violation mid-rollback)
    When RouterHaltsRollbackSqliteError fires
    Then the router halts with haltReason="mechanical_error" and failureCategory="sqlite_error"
    And rollbackRequested is cleared to FALSE
    And rollbackTargetWorktree is cleared to NULL
    And the ConsensusRound aggregate IS reset atomically: consensusState="open", unresolvedObjections=∅, overriddenObjections=∅ (v11 OBJ-EC-3 symmetric clean-slate principle)
    And consensusRoundStart is advanced to the current nextEvtId value (v11 OBJ-A — prevents pre-halt objections in the immutable eventLog from satisfying post-resume ModeratorEmitsCandidate guards)
    And Stop-AllBusAgents is called
    And the process exits with exit code 14 (sqlite_error per ExitCodeOf)
    And event_log is NOT mutated (the rollback halt does not append any new event type to event_log)
    And a subsequent "./vibe.ps1 -Resume" is available to the user, who may retry "/rollback" after resolving the SQLite issue

  @failure_recovery @integration
  Scenario: -Resume after RouterHaltsRollbackSqliteError allows retrying /rollback
    Given the pipeline halted via RouterHaltsRollbackSqliteError with failureCategory="sqlite_error"
    And agent_sessions shows all agents with status="ended"
    And bus_snapshots still contains the target snapshot (rollback was not applied)
    When the user runs "./vibe.ps1 -Resume"
    Then the router re-spawns agents from the pre-rollback SQLite state (bootstrap + ground_truth)
    And the bus enters busStatus="running" with rollbackRequested=FALSE and rollbackTargetWorktree=NULL
    And the user may issue a fresh "./vibe.ps1 -Rollback -SnapId <snap_id>" after confirming the SQLite issue is resolved
    And event_log is intact and unmodified by the failed rollback attempt

  # ---------------------------------------------------------------------------
  # RouterAbortsStaleRollback — v11 new action (OBJ-C(v10))
  # Two structural entry paths:
  #   1. Ctrl+C during rollback wait: bus halts via UserInterrupts while rollbackRequested=TRUE.
  #   2. Halted-state /rollback: UserRequestsRollback fires while busStatus="halted".
  # In both cases: RouterAbortsStaleRollback clears rollbackRequested and rollbackTargetWorktree,
  # preserves snapshot, and does NOT advance consensusRoundStart.
  # WF_vars(RouterAbortsStaleRollback) guarantees eventual abort — no permanent stuck state.
  # ---------------------------------------------------------------------------

  @failure_recovery @edge_case
  Scenario: RouterAbortsStaleRollback — Ctrl+C during pending rollback aborts the stale rollback and preserves the snapshot
    Given the bus is running (busStatus="running") with rollbackRequested=TRUE and rollbackTargetWorktree="wt-auth-flow"
    And snapshotExists["wt-auth-flow"]=TRUE (the target snapshot is present)
    And consensusState="open", unresolvedObjections={"evt-031"} (a debate is in flight)
    When the user presses Ctrl+C (UserInterrupts fires) while rollbackRequested=TRUE is still pending
    Then the bus halts with haltReason="user_interrupt" and failureCategory=NULL (UserInterrupts semantics)
    And rollbackRequested remains TRUE immediately after the Ctrl+C halt (the halt precedes the abort)
    And RouterAbortsStaleRollback subsequently fires (WF_vars guarantees eventual firing once busStatus="halted" AND rollbackRequested=TRUE)
    And RouterAbortsStaleRollback clears rollbackRequested to FALSE and rollbackTargetWorktree to NULL
    And snapshotExists["wt-auth-flow"] remains TRUE — the snapshot is NOT consumed (rollback did not execute)
    And consensusState, unresolvedObjections, and overriddenObjections are NOT reset (RouterAbortsStaleRollback does NOT advance consensusRoundStart — no clean-slate boundary occurred)
    And the user may run "./vibe.ps1 -Resume" followed by a fresh "./vibe.ps1 -Rollback -SnapId <snap_id>" to retry the rollback
    # TLA+ traceability (v11): RouterAbortsStaleRollback action, OBJ-C(v10). Entry path 1: UserInterrupts fires
    # while rollbackRequested=TRUE. WF_vars(RouterAbortsStaleRollback) ensures eventual clearing.
    # Snapshot preserved: snapshotExists[w] UNCHANGED. consensusRoundStart UNCHANGED.
    # Citation: BidirectionalComms.tla v11, RouterAbortsStaleRollback action (TLA lines 1540-1556).

  @edge_case @integration
  Scenario: RouterAbortsStaleRollback — /rollback issued against a halted bus is auto-aborted with user-visible feedback
    Given the bus has halted with haltReason="mechanical_error" and failureCategory="agent_crash" (busStatus="halted")
    And snapshotExists["wt-auth-flow"]=TRUE
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-003" while the bus is already halted
    Then UserRequestsRollback fires and sets rollbackRequested=TRUE (the TLA+ action accepts busStatus="halted")
    And RouterExecutesRollback does NOT fire because BusRunning=FALSE (BusRunning guard not satisfied)
    And RouterAbortsStaleRollback fires (busStatus="halted" AND rollbackRequested=TRUE is satisfied)
    And RouterAbortsStaleRollback clears rollbackRequested to FALSE and rollbackTargetWorktree to NULL
    And snapshotExists["wt-auth-flow"] remains TRUE — the snapshot is preserved for the retry
    And busStatus, haltReason, and failureCategory remain unchanged (the abort does not overwrite the existing halt state)
    And the CLI reports user-visible feedback: "Rollback aborted: bus is halted. Run './vibe.ps1 -Resume' first, then re-issue '/rollback' after the bus is running."
    And the process exits with the original halt exit code (exit 15 for agent_crash, unchanged by the abort)
    # TLA+ traceability (v11): RouterAbortsStaleRollback action, OBJ-C(v10) / OBJ-E(v10). Entry path 2:
    # UserRequestsRollback accepts busStatus="halted"; RouterAbortsStaleRollback fires instead of execute.
    # Without this action, rollbackRequested=TRUE would block UserResumes (OBJ-2(v9) guard) — structural deadlock.
    # Citation: BidirectionalComms.tla v11, RouterAbortsStaleRollback action; UserResumes guard ~rollbackRequested.

  @primary @integration
  Scenario: RouterAbortsStaleRollback WF fairness liveness — stale rollback is always eventually cleared when bus is halted
    Given a property test places the bus in busStatus="halted" with rollbackRequested=TRUE using the fixed seed stored under key "RouterAbortsStaleRollback" in tests/bus/properties/seeds.json
    And WF_vars(RouterAbortsStaleRollback) fairness is active — once continuously enabled, the action must eventually fire
    When the test runs for sufficient router transitions for the WF condition to discharge
    Then rollbackRequested eventually becomes FALSE (RouterAbortsStaleRollback fired)
    And the test fails if rollbackRequested remains TRUE indefinitely while busStatus="halted" (more than the configured liveness-check timeout)
    And the test verifies that UserResumes is unblocked after the abort (rollbackRequested=FALSE satisfies UserResumes precondition)
    And the test verifies both entry paths: (a) UserInterrupts-then-RouterAbortsStaleRollback and (b) UserRequestsRollback(halted)-then-RouterAbortsStaleRollback
    And on any failing sequence the runner shrinks to the minimal failing prefix and records the seed and prefix length in the test failure output
    # TLA+ traceability (v11): WF_vars(RouterAbortsStaleRollback) added in v11 OBJ-C(v10).
    # Both guard conditions (busStatus="halted" AND rollbackRequested=TRUE) are stable once set:
    # bus stays halted until resume; rollbackRequested persists until cleared. WF suffices.
    # Citation: BidirectionalComms.tla v11, Fairness clause WF_vars(RouterAbortsStaleRollback).

  # ---------------------------------------------------------------------------
  # v10 failureCategory post-resume-cycle scenario (FIX-1/2/3(v10))
  # ---------------------------------------------------------------------------

  @primary @integration
  Scenario: v10 FIX-1/2/3 — failureCategory is null at semantic halt after a mechanical-halt-then-resume cycle
    Given the bus halted with haltReason="mechanical_error" and failureCategory="agent_crash" due to an agent process crash
    And the pipeline_log records the halt with exit code 15
    When the user runs "./vibe.ps1 -Resume" and the bus re-enters busStatus="running"
    And the resumed bus reaches consensus_ratified (a semantic termination — RouterRatifiesConsensus fires)
    Then haltReason="consensus_ratified" and failureCategory=NULL in the final bus state
    And the process exits with exit code 0
    And the test verifies this specific trace order: mechanical_error halt (failureCategory="agent_crash") → -Resume → BusRunning → RouterRatifiesConsensus → halted(haltReason="consensus_ratified", failureCategory=NULL)
    And the test does NOT rely on random event ordering — the trace is explicitly constructed to force this sequence
    And the same assertion applies to RouterHaltsFeatureComplete (FIX-1) and RouterFailsConsensus (FIX-3): all three semantic halt actions must set failureCategory=NULL explicitly
    # TLA+ traceability (v11): FIX-1/2/3(v10) added failureCategory'=NULL to RouterHaltsFeatureComplete,
    # RouterRatifiesConsensus, and RouterFailsConsensus. Root cause: after a mechanical halt + resume, the bus
    # carried a non-NULL failureCategory which violated the bidirectional MechanicalHaltHasCategory (OBJ-15(v9)).
    # Citation: BidirectionalComms.tla v11, FIX-1/2/3 comment block in cfg; INVARIANT MechanicalHaltHasCategory (cfg line 163).

  # ---------------------------------------------------------------------------
  # ModeratorEmitsCandidate ground-truth-per-objector guard (OBJ-10(v9))
  # ---------------------------------------------------------------------------

  @primary @integration
  Scenario: ModeratorEmitsCandidate ground-truth guard — consensus_candidate is not emitted until every agent with an unresolved objection has received ground_truth in the current round
    Given a debate has agents "expert-tla" and "expert-bdd" with unresolved objections evt-031 and evt-032 respectively
    And "expert-tla" has groundTruthDelivered=TRUE (ground truth was prepended to the last message in this round)
    And "expert-bdd" has groundTruthDelivered=FALSE (ground truth has not yet been delivered in this round)
    When the debate moderator attempts to emit a consensus_candidate event
    Then the router blocks the consensus_candidate from being routed because groundTruthDelivered["expert-bdd"]=FALSE while evt-032 remains unresolved (OBJ-10(v9) guard)
    And the router delivers ground_truth to "expert-bdd" before allowing the consensus_candidate to proceed
    And only after groundTruthDelivered["expert-bdd"] transitions to TRUE does the router route the consensus_candidate
    And event_log confirms the ordering: ground_truth to "expert-bdd" → consensus_candidate from moderator
    And the test verifies that the ground-truth-per-objector guard applies to all agents with current-round unresolved objections, not just the moderator
    # TLA+ traceability (v11): ModeratorEmitsCandidate guard extended in v9 OBJ-10 to require
    # groundTruthDelivered=TRUE for every agent with an unresolved objection before candidate emission.
    # v11 OBJ-A further constrains the guard: e.evt_id >= consensusRoundStart (consensus-round epoch)
    # so pre-rollback objections in the immutable eventLog cannot satisfy the guard in a post-rollback round.
    # Citation: BidirectionalComms.tla v11, ModeratorEmitsCandidate action (TLA lines 953-976); OBJ-10(v9) + OBJ-A(v11).

  # ---------------------------------------------------------------------------
  # consensusRoundStart epoch — v11 OBJ-A(v10): epoch-scoped ModeratorEmitsCandidate guard
  # These scenarios verify that the consensus-round epoch correctly isolates post-rollback
  # rounds from pre-rollback objection events in the immutable eventLog.
  # ---------------------------------------------------------------------------

  @primary @integration
  Scenario: consensusRoundStart epoch — post-rollback fresh consensus round ignores pre-rollback objections in eventLog
    Given a debate produced objection evt-031 from "expert-tla" (evt_id=31) and objection evt-032 from "expert-bdd" (evt_id=32)
    And the user invokes "/rollback" and RouterExecutesRollback fires, resetting consensusState="open", unresolvedObjections=∅, overriddenObjections=∅, and advancing consensusRoundStart to the current nextEvtId (e.g., consensusRoundStart=50)
    And the bus is resumed and agents are respawned for the post-rollback round
    When the debate moderator attempts to emit a consensus_candidate event in the fresh round (no new objections have been raised yet)
    Then the ModeratorEmitsCandidate guard evaluates objections as: ∃ e ∈ eventLog : e.type="objection" ∧ e.evt_id >= consensusRoundStart (50)
    And evt-031 (evt_id=31) and evt-032 (evt_id=32) do NOT satisfy this guard because 31 < 50 and 32 < 50
    And no consensus_candidate is blocked by the pre-rollback objections in the immutable eventLog
    And the router routes the consensus_candidate without requiring ground_truth delivery for "expert-tla" or "expert-bdd" based on pre-rollback objections
    And event_log confirms the fresh round proceeds independently of the pre-rollback debate history
    # TLA+ traceability (v11): OBJ-A(v10) epoch-scoped guard in ModeratorEmitsCandidate (TLA line 958):
    # e.evt_id >= consensusRoundStart. Prevents pre-rollback events from satisfying post-rollback guards.
    # Citation: BidirectionalComms.tla v11, ModeratorEmitsCandidate action, consensusRoundStart variable (TLA lines 387, 958-961).

  @primary @integration
  Scenario: RouterHaltsRollbackSqliteError advances consensusRoundStart — post-resume round is isolated from pre-halt objections
    Given a debate produced objections evt-041 and evt-042 (evt_ids 41, 42) before a SQLite error interrupted the rollback
    And RouterHaltsRollbackSqliteError fired, resetting the ConsensusRound aggregate and advancing consensusRoundStart to nextEvtId (e.g., consensusRoundStart=60)
    And the user resolves the SQLite issue and runs "./vibe.ps1 -Resume"
    When agents are respawned and the fresh post-resume debate begins without any new objections yet
    Then the ModeratorEmitsCandidate guard uses consensusRoundStart=60 as the epoch filter
    And evt-041 (evt_id=41) and evt-042 (evt_id=42) do NOT satisfy the ∃ guard (41 < 60, 42 < 60)
    And the moderator may emit a consensus_candidate without being blocked by the pre-halt objections
    And the test distinguishes RouterHaltsRollbackSqliteError (consensusRoundStart advances) from RouterAbortsStaleRollback (consensusRoundStart does NOT advance, no clean-slate boundary)
    # TLA+ traceability (v11): RouterHaltsRollbackSqliteError resets consensusRoundStart'=nextEvtId (TLA line 1513).
    # This is the OBJ-A(v10) coupling: failure path mirrors the success path (RouterExecutesRollback line 1462).
    # Citation: BidirectionalComms.tla v11, RouterHaltsRollbackSqliteError (TLA lines 1501-1523).

  @edge_case @integration
  Scenario: OBJ-B coupling — pre-rollback objector with groundTruthDelivered=FALSE does not block fresh post-rollback consensus round
    Given a debate produced objection evt-031 from "expert-tla" (evt_id=31) with groundTruthDelivered["expert-tla"]=FALSE at the time of rollback
    And RouterExecutesRollback fired, advancing consensusRoundStart to 50, resetting unresolvedObjections=∅
    And the bus is resumed; "expert-tla" is respawned with groundTruthDelivered["expert-tla"] reset to FALSE (RouterRespawnsAgent resets this flag)
    When the debate moderator attempts to emit a consensus_candidate in the fresh post-rollback round (no new objections raised yet)
    Then the ModeratorEmitsCandidate guard evaluates: ∀ e ∈ eventLog : (e.type="objection" ∧ e.from ∈ Agents ∧ e.evt_id >= consensusRoundStart=50) ⇒ groundTruthDelivered[e.from]
    And evt-031 (evt_id=31) does NOT satisfy e.evt_id >= 50, so "expert-tla"'s groundTruthDelivered state is irrelevant to the post-rollback guard
    And the consensus_candidate is NOT blocked by the pre-rollback objector's groundTruthDelivered=FALSE state
    And event_log confirms the moderator emits consensus_candidate without waiting for ground_truth re-delivery to "expert-tla" based on the pre-rollback objection
    # TLA+ traceability (v11): OBJ-B coupling resolved by OBJ-A epoch-scoping (cfg change notes, cfg lines 7-11).
    # The ∀ guard in ModeratorEmitsCandidate (TLA lines 959-961) is restricted to e.evt_id >= consensusRoundStart,
    # so pre-rollback objectors with groundTruthDelivered=FALSE are excluded from the post-rollback ∀ constraint.
    # Citation: BidirectionalComms.tla v11, ModeratorEmitsCandidate (TLA lines 953-976); consensusRoundStart epoch.

  @edge_case @integration
  Scenario: consensusRoundStart epoch — consensus_candidate event must NOT be emitted using objection events whose evt_id is below consensusRoundStart
    Given a debate has two eras of objections in the immutable eventLog:
      And pre-rollback objections evt-015 and evt-016 (evt_ids 15, 16) from a prior round
      And post-rollback objections evt-071 and evt-072 (evt_ids 71, 72) from the current round (consensusRoundStart=65)
    And groundTruthDelivered["expert-tla"]=TRUE and groundTruthDelivered["expert-bdd"]=TRUE for the current round
    When the ModeratorEmitsCandidate guard is evaluated
    Then the ∃ guard is satisfied by evt-071 and evt-072 (71 >= 65, 72 >= 65 — current-round objections)
    And the ∀ ground-truth guard applies only to agents whose objection evt_id >= consensusRoundStart=65 (expert-tla and expert-bdd for evt-071, evt-072)
    And the router emits consensus_candidate (both guards satisfied by current-round data alone)
    And the test asserts: if only pre-rollback objections evt-015, evt-016 existed (no post-rollback objections), the ∃ guard would FAIL (15 < 65, 16 < 65) and no consensus_candidate would be emitted
    # TLA+ traceability (v11): OBJ-A(v10) epoch guard. consensusRoundStart partitions eventLog into
    # prior-round (excluded from guards) and current-round (included). Both ∃ and ∀ guards use the same epoch.
    # Citation: BidirectionalComms.tla v11, ModeratorEmitsCandidate (TLA lines 958-961).

# =============================================================================
# Item 26 — Trace Replay
# tests/bus/traces/ captures and replays event sequences as regression tests
# =============================================================================

Feature: Trace replay allows capturing and re-running event sequences as deterministic regression tests
  A trace is an NDJSON file; replay drives the bus and an oracle validates the outcome

  @primary @integration
  Scenario: A trace file is valid NDJSON with one event envelope per line
    Given a trace file is captured from a real or simulated pipeline run
    When the trace file format is validated
    Then each line is a valid JSON object with fields: evt_id, from, to, in_reply_to, type, payload, group_id (nullable), status, captured_at
    And the file uses UTF-8 encoding with LF line endings
    And the evt_ids within the file are unique and monotonically increasing

  @primary @integration
  Scenario: Trace capture is triggered by a test flag and writes to tests/bus/traces/
    Given a test or development run is started with the VIBE_CAPTURE_TRACE environment variable set
    When events are routed through the bus
    Then each routed event is appended to a trace file in tests/bus/traces/ named "<feature>-<timestamp>.ndjson"
    And capture does not affect routing behavior or event_log contents

  @primary @integration
  Scenario: Trace replay drives the bus through the captured sequence using test doubles
    Given a trace file "auth-flow-2026-04-17.ndjson" exists in tests/bus/traces/
    And claude-test-double.ps1 and git-test-double.ps1 are configured to respond to the trace's events
    When the trace replay runner is invoked with the trace file
    Then the router processes each event from the trace in order
    And the router does not require real agent processes to replay

  @primary @integration
  Scenario: Trace replay oracle validates event_log outcome matches the captured trace using canonical JSON comparison
    Given the trace replay runner has completed processing "auth-flow-2026-04-17.ndjson"
    When the oracle compares the replay event_log to the captured trace
    Then every evt_id in the trace appears in the replay event_log with the same type, from, and to fields
    And the oracle compares payload semantics using canonical JSON form: both the captured payload and the replay payload are normalized to sorted keys and no insignificant whitespace before comparison
    And a payload that differs after canonical normalization is a test failure; a payload that differs only in whitespace or key ordering is NOT a test failure
    And timing deltas are NOT asserted: the oracle does not compare captured_at timestamps or inter-event durations between the trace and the replay
    And the oracle reports a test failure if any evt_id is missing, has a different type, has a different routing target, or has a payload that differs after canonical normalization
    And the canonical normalization function is the same shared implementation used in both capture and replay paths to prevent divergence

  @failure_recovery @integration
  Scenario: A trace captured at the moment of a crash enables exact crash reproduction
    Given a pipeline crashed mid-run and a trace was captured up to the crash point
    When the trace is replayed in the test environment
    Then the bus reaches the same final event_log state as the captured crash
    And the crash-triggering condition (e.g., duplicate evt_id, group violation) is reproduced and observable in the replay

# =============================================================================
# Item 27 — Performance and Non-Functional Requirements
# =============================================================================

Feature: The bus meets throughput, latency, and resource bounds required for the pipeline
  These properties are measured and fail-fast if violated during CI performance tests

  @quality_attribute @integration
  Scenario: performance-baselines.json is committed to the repository before any performance test runs
    Given the CI pipeline is building a PR or merging to main
    When the performance-test CI job starts
    Then a pre-check step asserts that tests/bus/performance-baselines.json exists in the repository at the current HEAD
    And the CI job fails immediately with the message "tests/bus/performance-baselines.json not found — commit the baselines file before enabling performance tests" if the file is absent
    And no performance benchmark is measured or compared until the file exists
    And this gate prevents CI from silently comparing against a missing baseline and reporting a false pass

  @quality_attribute @integration
  Scenario: Baseline-capture mode seeds tests/bus/performance-baselines.json without gating on the file's prior existence
    Given tests/bus/performance-baselines.json does not yet exist in the repository (first-time capture)
    And the CI job named "capture-baselines" is invoked explicitly (not the standard "run-performance-tests" job)
    When the capture job runs with assertions DISABLED (no regression gates fire)
    Then it measures observed values for all performance metrics: throughput (evt/s), p50 latency (ms), p95 latency (ms), p99 latency (ms), per_agent_rss_mb_max, total_rss_mb_max, wal_size_mb_max, wal_checkpoint_interval_events, in_reply_to_chain_max_depth, fd_budget_max, soak_max_event_log_rows, and checkpoint_wall_clock_ms
    And it writes the observed values to tests/bus/performance-baselines.json in the repository, including the runner_spec object (cpu_class, ram_gb, disk_type)
    And the capture job commits and pushes the baselines file with a commit message identifying it as a baseline capture run
    And once the baselines file is committed, subsequent "run-performance-tests" jobs use it for regression gating
    And the capture job is documented to run exactly once per new CI runner class; re-running it intentionally overwrites the prior baselines

  @quality_attribute @integration
  Scenario: Router sustains at least 50 events per second under sustained load for at least 30 seconds
    Given a performance test routes events continuously through the router with in-memory SQLite for a minimum of 30 seconds
    When the test measures total elapsed time and total events routed
    Then the aggregate throughput is at least 50 events per second over the full 30-second window
    And no mechanical errors occur during the run

  @quality_attribute @integration
  Scenario: End-to-end per-message event latency is within bounds at all percentiles including p95
    Given a performance test measures the time from Send-BusEvent call to event_log row insertion for 500 events (scope: per-message latency, not aggregate or e2e)
    When latency percentiles are computed
    Then the p50 latency (per-message scope) is below 500 milliseconds
    And the p95 latency (per-message scope) is below 1200 milliseconds
    And the p99 latency (per-message scope) is below 2000 milliseconds
    And the p95 metric is reported independently so tail-latency regressions in the 20%-above-p95 band are detectable without relying on p99 alone

  @quality_attribute @boundary
  Scenario: Heartbeat query completes in under 200 milliseconds at 10000 event_log rows
    Given event_log contains 10000 rows with mixed status, type, and group_id values
    And the event_log has a composite index on (status, type, group_id)
    When the heartbeat query runs to compute idle times for alive agents
    Then the query completes in under 200 milliseconds
    And the index presence is verified as part of the migration schema test

  @quality_attribute @boundary
  Scenario: Stage 7 concurrent agent count does not exceed the configured process ceiling
    Given Stage 7 has more tasks to dispatch than the configured process ceiling (default: 16 simultaneous agents)
    When the pipeline dispatches tasks
    Then the number of alive agent_sessions rows never exceeds the ceiling at any point
    And excess tasks queue until a slot is available
    And the ceiling is configurable via vibe configuration, not hardcoded in the router

  @quality_attribute @integration
  Scenario: Session renewal costs at least 20 percent fewer tokens than a cold-start equivalent for the same agent role
    Given a performance baseline captures the token cost of starting a fresh agent with bootstrap + ground_truth
    And a renewal sequence captures the token cost of bootstrap + ground_truth + checkpoint_response
    When the costs are compared for an agent that has processed 40 turns
    Then the renewal path consumes at least 20% fewer tokens than the equivalent cold-start path would require to reconstruct the same effective context
    And the test fails if the measured savings are less than 20%
    And the savings percentage is logged as a pipeline metric for tracking over time

  @quality_attribute @integration
  Scenario: Throughput regression is detected independently as a dedicated CI failure
    Given all performance tests run in a dedicated CI environment with no noisy-neighbor processes sharing CPU or I/O
    And each performance metric is preceded by 3 warm-up laps before measurement begins
    When a performance test records a throughput result
    Then the result is compared against the committed baseline at tests/bus/performance-baselines.json
    And the test fails if throughput regresses by more than 10% versus the baseline value
    And the baseline file must be updated explicitly and committed when performance intentionally changes (accidental drift is a test failure)

  @quality_attribute @integration
  Scenario: Latency regression is detected independently as a dedicated CI failure across all three percentiles
    Given the same CI environment and warm-up configuration as the throughput test
    When a performance test records p50, p95, and p99 latency results (per-message scope)
    Then the test fails if p50 latency increases by more than 20% versus the p50 baseline value
    And the test fails if p95 latency increases by more than 20% versus the p95 baseline value
    And the test fails if p99 latency increases by more than 20% versus the p99 baseline value
    And p95 baseline is committed to tests/bus/performance-baselines.json under key "p95_latency_ms"
    And a latency regression is reported as a separate CI failure from a throughput regression
    And p50, p95, and p99 are each reported as individual CI annotations so regressions are pinpointed without reading combined output

  @quality_attribute @integration
  Scenario: Token-savings regression is detected independently as a dedicated CI failure
    Given the same CI environment and warm-up configuration as the throughput test
    When a performance test records the session-renewal token-savings percentage
    Then the test fails if token savings drop by more than 5 percentage points versus the baseline value
    And a token-savings regression is reported as a separate CI failure from throughput and latency regressions

  @quality_attribute @integration
  Scenario: Performance baselines file includes CI runner specification for provenance
    Given tests/bus/performance-baselines.json is committed to the repository
    When the file is inspected
    Then it contains a "runner_spec" object with at minimum: cpu_class (e.g., "2-core x86_64"), ram_gb (e.g., 7), disk_type (e.g., "SSD")
    And the CI environment that measures performance must match the runner_spec before recording results
    And a CI job fails if a PR modifies the numeric baseline thresholds without also updating the runner_spec or adding a "change_rationale" field explaining the intentional change
    And this provenance check prevents silent baseline edits that would bypass regression enforcement

  @quality_attribute @edge_case
  Scenario: Checkpoint-driven respawn does not transiently overshoot the configured process ceiling
    Given Stage 7 has exactly the process ceiling (default: 16) alive agents in agent_sessions
    When the router determines that one of those agents requires checkpoint renewal
    Then the router does not call Start-BusAgent for the replacement until Stop-BusAgent has fully returned for the old agent
    And at no point during the renewal sequence does agent_sessions contain more than ceiling (16) rows with status="alive"
    And the transient alive-count during checkpoint respawn is strictly bounded by ceiling, not ceiling+1

  @quality_attribute @integration
  Scenario: 60-minute sustained soak test does not exceed per-agent RSS, WAL growth, latency drift, or throughput drift bounds
    Given a soak test runs the router continuously for 60 minutes with in-memory SQLite and 16 concurrent agents simulated via test doubles
    When the test completes
    Then no individual agent process exceeds the per-agent RSS bound committed to tests/bus/performance-baselines.json (key: "per_agent_rss_mb_max")
    And the SQLite WAL file size does not exceed the WAL bound committed to performance-baselines.json (key: "wal_size_mb_max") at any 10-minute checkpoint
    And the router performs a PRAGMA wal_checkpoint at the interval committed to performance-baselines.json (key: "wal_checkpoint_interval_events") to prevent unbounded WAL growth
    And no mechanical errors occur during the 60-minute run
    And the per-message p50 latency measured in the final 10-minute window does not exceed 125% of the p50 latency measured in the first 10-minute window (latency drift ≤ 25%)
    And the per-message p95 latency measured in the final 10-minute window does not exceed 125% of the p95 latency measured in the first 10-minute window
    And the per-message p99 latency measured in the final 10-minute window does not exceed 125% of the p99 latency measured in the first 10-minute window
    And the aggregate throughput measured in the final 10-minute window does not fall below 80% of the throughput measured in the first 10-minute window (throughput drift ≤ 20%)
    And the event_log row count at the end of the soak does not exceed the bound committed to performance-baselines.json (key: "soak_max_event_log_rows") ensuring no unbounded log growth
    And GC/allocator growth is bounded: the PowerShell process working set at the 60-minute mark does not exceed 150% of the working set at the 1-minute mark
    And these drift assertions are evaluated at 10-minute intervals throughout the run so a router that stops routing mid-soak will fail at the first interval where throughput drops
    And the soak test fails if ANY of the above bounds are breached at ANY measurement interval

  @quality_attribute @integration
  Scenario: Per-agent RSS envelope is measured and bounded for 16 concurrent agents
    Given a test spawns 16 concurrent claude-test-double.ps1 processes via Start-BusAgent
    And each test double runs for at least 5 minutes exchanging events
    When the test measures the working-set (RSS) of each process at 1-minute intervals
    Then the peak RSS for each individual agent process does not exceed the bound in tests/bus/performance-baselines.json (key: "per_agent_rss_mb_max")
    And the aggregate RSS of all 16 agent processes does not exceed the aggregate bound in performance-baselines.json (key: "total_rss_mb_max")

  @quality_attribute @edge_case
  Scenario: File descriptor exhaustion is tested for 16 agents with all pipes and handles open simultaneously
    Given a test spawns 16 agents, each with 3 pipes (stdin, stdout, stderr), plus 1 SQLite connection, 1 log file handle, and 1 git handle per worktree (8 worktrees)
    When all handles are open simultaneously and 500 events are routed
    Then no EMFILE (too many open files) error is raised
    And the test asserts the total handle count is within the configurable file-descriptor budget in tests/bus/performance-baselines.json (key: "fd_budget_max")
    And if the handle count approaches within 20% of the OS limit the test logs an "[ALARM]" warning via Write-PipelineLog

  @quality_attribute @boundary
  Scenario: Aggregate ground-truth composition budget does not exceed 50ms per event at 50 evt/s with 16 agents (aggregate scope, not per-message)
    Given the router is processing 50 events per second (aggregate throughput scope) across 16 alive agents
    When ground-truth composition is measured across a 30-second window
    Then the aggregate ground-truth composition time per event (summed across all 16 per-agent compositions triggered by that event, aggregate scope) does not exceed 50 milliseconds
    And the per-agent ground-truth composition mean is 3.1 milliseconds (derived: 50ms ÷ 16 agents — this is the MEAN, not a per-agent ceiling; the metric key in performance-baselines.json is "ground_truth_composition_mean_ms_per_agent" to prevent misreading as a ceiling)
    And if the aggregate budget is exceeded for any single event, Write-PipelineLog records a warning identifying the triggering event, the total composition time, and which agent roles were slowest
    And the ground-truth composition does not perform unbounded SQLite scans: it queries only indexed columns with a row limit of at most 2× the current alive agent count
    And the ground-truth query plan is verified via EXPLAIN QUERY PLAN: no full-table scan (no "SCAN TABLE event_log" without an index) is produced for the ground-truth fetch
    And the per-turn SQLite read count per agent for ground-truth composition does not exceed 2 reads per alive agent per ground-truth cycle (cold-cache and warm-cache bounds are separately committed to performance-baselines.json)

  @quality_attribute @boundary
  Scenario: Heartbeat emitter CPU cost is bounded for a 10000-row event_log — emitter-side only, no double-count with listener
    Given event_log contains 10000 rows representing approximately 3.3 hours of pipeline activity at 50 evt/s
    And the heartbeat fires every 10 seconds (360 times per hour)
    When the heartbeat emitter runspace executes 360 consecutive queries against the 10000-row event_log (emitter-side cost only; idle-time listener polling cost is budgeted separately under key "heartbeat_listener_poll_p95_ms" in performance-baselines.json)
    Then the CPU time consumed by all 360 heartbeat emitter queries combined does not exceed 72 CPU-seconds per hour (200ms p95 per-query cap × 360 queries = 72 s/hr at p95; budget is derived from the p95 cap, not the p50)
    And the p50 CPU time for all 360 queries combined is at most 18 CPU-seconds per hour (50ms p50 × 360)
    And each individual heartbeat query completes in under 200 milliseconds at p95 as established in the heartbeat-query performance scenario
    And the heartbeat query uses only indexed columns (verified in the migration schema test) to prevent full-table scans
    And this bound is committed to tests/bus/performance-baselines.json under key "heartbeat_max_cpu_sec_per_hr" as 72 (p95 budget, not p50)

  @quality_attribute @boundary
  Scenario: Heartbeat listener poll cost — p95 observed and committed; not gated until baseline-capture run confirms value
    Given the heartbeat listener polls for idle-time data to display in the heartbeat banner
    And the listener poll fires at the same 10-second cadence as the emitter
    When 360 consecutive listener poll calls are measured against a 10000-row event_log (3.3 hours of activity)
    Then the p95 poll latency is observed and committed to tests/bus/performance-baselines.json under key "heartbeat_listener_poll_p95_ms"
    And this scenario is @observational-only until the baseline-capture CI job has committed the initial value — no regression gate fires on first capture
    And once a baseline value is committed, subsequent CI runs gate: p95 listener poll must not regress by more than 20% versus the committed baseline
    And the listener poll uses only indexed columns (verified in migration schema test) to prevent full-table scans
    # Low-priority observational metric: value is committed on first baseline-capture run;
    # regression gate activates automatically on subsequent runs once the key exists in performance-baselines.json.

  @quality_attribute @boundary
  Scenario: evt_id allocator throughput does not become a bottleneck under 16-agent fan-out
    Given 16 agents are simultaneously sending done events triggering evt_id allocation
    When the allocator is called 160 times in a burst (16 agents × 10 events each) within a single 1-second window
    Then all 160 allocations complete within the 1-second window
    And the allocator throughput is at least 500 allocations/second as committed to tests/bus/performance-baselines.json under key "evt_id_allocator_min_allocs_per_sec"
    And 500 allocations/second represents ≥ 10× the design aggregate event rate of 50 evt/s — headroom is at least 10× aggregate load (documented in performance-baselines.json under key "evt_id_allocator_headroom_factor" as 10)
    And at 16 callers the per-caller throughput floor is ≥ 31 allocations/second (500 ÷ 16 = 31.25/caller) — verified in the contended-ratio assertion below
    And the synchronization primitive protecting the allocator does not become the throughput ceiling at 16-agent fan-out
    And the test measures allocator throughput in isolation (no SQLite writes) and under full load (with concurrent SQLite writes) and asserts the ratio is ≥ 0.80

  @quality_attribute @boundary
  Scenario: Fan-out aggregation latency scales linearly as group size grows from 1 to 16 members
    Given the router is configured with groups of varying sizes: 1, 4, 8, and 16 members
    When Wait-BusGroup completes for each group size after all members have replied simultaneously
    Then the p50 aggregation latency for 1 member is under 5 milliseconds
    And the p50 aggregation latency for 4 members is under 20 milliseconds
    And the p50 aggregation latency for 8 members is under 40 milliseconds
    And the p50 aggregation latency for 16 members is under 80 milliseconds
    And the test fails if any group size produces super-linear aggregation growth: specifically, 16 members must not take more than 4.0× the p50 latency of 4 members (named slack: exact multiple 4.0, not 3.9)
    And the test additionally asserts: 8-member p50 latency ≤ 2.0× 4-member p50 latency (named 8-vs-4 bound — a 3.9× quadratic creep from 4→8 is also a failure, not just 4→16)
    And these two scaling assertions are independently reportable: a super-linear jump from 4 to 8 members is a failure even if the 16-member assertion passes
    And the bounds are committed to tests/bus/performance-baselines.json under key "fan_out_aggregation_latency_ms" indexed by group size

  @quality_attribute @boundary
  Scenario: Checkpoint cycle wall-clock cost is bounded and checkpoint thrash prevention is enforced
    Given an agent undergoes a full checkpoint renewal cycle (checkpoint event → checkpoint_response → Stop-BusAgent → Start-BusAgent → deliver bootstrap + ground_truth + checkpoint_response)
    When the full renewal cycle is timed from checkpoint event emission to the replacement agent receiving its third event
    Then the wall-clock cost of the full cycle does not exceed the bound committed to tests/bus/performance-baselines.json under key "checkpoint_wall_clock_ms"
    And as a hard absolute ceiling independent of any baseline: the checkpoint cycle must complete within 30 seconds on any CI runner matching the runner_spec; this absolute ceiling gate is a separate CI failure from the baseline-regression gate (the baseline may drift QoQ but can never exceed 30 seconds)
    And if the absolute ceiling is exceeded, the CI failure message explicitly reads "checkpoint cycle exceeded absolute ceiling of 30 seconds" — distinguishable from the baseline-regression message
    And the router enforces a minimum inter-checkpoint interval: an agent cannot be checkpointed again until at least the interval committed to performance-baselines.json under key "checkpoint_min_interval_events" (minimum number of routed events per agent since last renewal) has elapsed
    And this minimum interval prevents checkpoint thrash where a slow agent triggers renewal on every other turn
    And the thrash-prevention interval is configurable, not hardcoded in the router

  @edge_case @quality_attribute
  Scenario: Heartbeat arriving during an in-progress checkpoint sequence does not reflect stale agent state
    Given the checkpoint renewal sequence for "tla-writer" is in progress: checkpoint event sent, checkpoint_response received, Stop-BusAgent called but Start-BusAgent has not yet returned
    When the heartbeat timer fires during this window
    Then the heartbeat banner omits "tla-writer" entirely (it is neither alive nor newly spawned yet)
    And the heartbeat banner does not show the old session_id as alive
    And the heartbeat banner does not show the new session_id as alive until Start-BusAgent has completed and written the new row to agent_sessions
    And no race condition produces a banner showing both the old and new session_id simultaneously

  @quality_attribute @boundary
  Scenario: Heartbeat cadence is tied to the 80-percent checkpoint threshold so no monitoring dead zone exists
    Given the checkpoint threshold fires at ~80% of the model context window
    And the heartbeat fires every 10 seconds
    When the router is evaluating context usage and an agent's total_tokens climbs toward the checkpoint threshold
    Then at least one heartbeat tick fires between the agent's last result event and the token usage reaching 80% (because typical turns take longer than 10 seconds)
    And a monitoring dead zone — a window longer than 10 seconds during which the agent is approaching 80% context but no heartbeat is visible — cannot exist in steady state
    And the heartbeat idle-time column provides a visible proxy for context-window pressure: an agent with low idle time is making fast progress and approaching the threshold faster

  @quality_attribute @boundary
  Scenario: in_reply_to chain depth is bounded to prevent correlation-table memory growth
    Given the router has been running for a long session and a single event thread has accumulated 1000 in_reply_to hops (one reply referencing another, forming a deep chain)
    When the router resolves the in_reply_to chain for correlation (e.g., to display a conversation graph)
    Then the router limits chain traversal to the depth bound committed to tests/bus/performance-baselines.json (key: "in_reply_to_chain_max_depth")
    And if a chain exceeds the bound, the router logs a "[WARN]" entry identifying the chain root evt_id and the truncated depth
    And no unbounded recursion or linear scan of the full event_log is performed for chain resolution

  @quality_attribute @boundary
  Scenario: Aggregate ground-truth composition budget — per-agent mean is a mean, not a per-agent ceiling; distribution must be bounded
    Given the router is processing 50 events per second (aggregate throughput scope) across 16 alive agents
    When ground-truth composition is measured across a 30-second window for each individual agent
    Then the aggregate ground-truth composition time per event (summed across all 16 per-agent compositions triggered by that event) does not exceed 50 milliseconds
    And the per-agent mean composition time is 50ms ÷ 16 agents = 3.1ms (this is a mean, not a per-agent ceiling — the metric is labeled "ground_truth_composition_mean_ms_per_agent" in performance-baselines.json)
    And the per-agent p95 composition time (not the mean) does not exceed the bound committed to performance-baselines.json under key "ground_truth_composition_p95_ms_per_agent"
    And the ground-truth composition does not perform unbounded SQLite scans: it queries only indexed columns with a row limit of at most 2× the current alive agent count
    And the ground-truth query plan is verified via EXPLAIN QUERY PLAN: no full-table scan is produced
    And the per-turn SQLite read count per agent does not exceed 2 reads per alive agent per cycle

  @quality_attribute @boundary
  Scenario: TypeSenderACL recipient-side (to-side) check does not add more than 50% overhead to the existing from-side check (v9 OBJ-5 hot-path)
    Given the router validates envelopes at 50 events per second under sustained load
    And v9 OBJ-5 added a second per-envelope ACL lookup for the recipient side (to-side partition check)
    When the test measures the per-envelope ACL validation time before and after enabling recipient-side validation over 500 consecutive envelopes
    Then the combined from+to ACL validation p95 does not exceed the bound committed to tests/bus/performance-baselines.json under key "type_sender_acl_combined_p95_ms"
    And the recipient-side ACL overhead (isolated) does not exceed the bound committed under key "type_sender_acl_to_side_overhead_p95_ms"
    And the ratio of combined-ACL-p95 to from-only-ACL-p95 does not exceed 2.0 (the to-side lookup must not double total ACL cost at p95)
    And both bounds are committed as separate baseline keys so regressions in either dimension are independently reportable

  @quality_attribute @boundary
  Scenario: Handler-epoch guard (handlerPendingEpoch check on HandlerAdapterCompletes) does not exceed p95 latency budget under checkpoint-heavy load
    Given the router is processing HandlerAdapterCompletes at high frequency (test scenario: 50 completions per second across 1 handler, simulating checkpoint-heavy load where agents respawn frequently)
    When the per-completion epoch-guard check time is measured over 500 consecutive HandlerAdapterCompletes transitions
    Then the epoch-guard check p95 latency does not exceed the bound committed to tests/bus/performance-baselines.json under key "handler_epoch_guard_p95_ms"
    And the bail-out rate (completions rejected by the epoch guard) under checkpoint-heavy load does not exceed the bound committed under key "handler_epoch_guard_max_rejection_rate_per_sec"
    And the epoch guard uses an O(1) lookup (not a scan of event_log) to compare spawnedAtEvt[a] against handlerPendingEpoch[h]
    And the test measures bail-out rate independently of overall HandlerAdapterCompletes throughput so stale-epoch spikes are visible without being masked by the passing-epoch baseline

  @quality_attribute @boundary
  Scenario: RouterHaltsRollbackSqliteError detection-to-halt latency is bounded
    Given the bus is running with rollbackRequested=TRUE when a SQLite error occurs during rollback
    When RouterHaltsRollbackSqliteError fires and the router transitions to busStatus="halted"
    Then the elapsed time from SQLite error detection to haltReason="mechanical_error" written to the final SQLite state does not exceed the bound committed to tests/bus/performance-baselines.json under key "rollback_sqlite_error_halt_latency_ms"
    And the bound is an absolute ceiling independent of any baseline: if the bound is exceeded, the CI failure message explicitly reads "RouterHaltsRollbackSqliteError halt latency exceeded bound"
    And rollbackRequested and rollbackTargetWorktree are cleared atomically in the same action as the halt transition (no partial state window)
    And the ConsensusRound aggregate reset (consensusState, unresolvedObjections, overriddenObjections, consensusRoundStart) is included in the same atomic write as the halt state — no partial reset window

  @quality_attribute @boundary
  Scenario: RouterAbortsStaleRollback detection-to-clear latency is bounded
    Given the bus is in busStatus="halted" with rollbackRequested=TRUE (either via Ctrl+C or halted-state /rollback)
    When RouterAbortsStaleRollback fires and clears rollbackRequested to FALSE and rollbackTargetWorktree to NULL
    Then the elapsed time from WF-fairness enabling condition satisfied to rollbackRequested=FALSE persisted to SQLite does not exceed the bound committed to tests/bus/performance-baselines.json under key "rollback_abort_stale_latency_ms"
    And the bound is symmetric with "rollback_sqlite_error_halt_latency_ms" (same order of magnitude — both measure rollback-subsystem state transitions under halt conditions)
    And the CI failure message explicitly reads "RouterAbortsStaleRollback clear latency exceeded bound" if breached
    And this baseline key is committed separately from the halt-latency key so regressions in the abort path are independently reportable

  @quality_attribute @boundary
  Scenario: ModeratorEmitsCandidate epoch-scoped eventLog scan p95 budget does not regress under large eventLog
    Given the router is processing a debate with event_log containing 10000 rows (approximately 3.3 hours of pipeline activity)
    And consensusRoundStart=9500 (the last rollback advanced the epoch to evt_id 9500, leaving 9499 pre-epoch rows)
    When ModeratorEmitsCandidate fires and evaluates both the ∃ guard (any objection with evt_id >= 9500) and the ∀ ground-truth guard (all agents with objection evt_id >= 9500 have groundTruthDelivered=TRUE)
    Then the guard evaluation p95 latency does not exceed the bound committed to tests/bus/performance-baselines.json under key "moderator_emits_candidate_guard_p95_ms"
    And EXPLAIN QUERY PLAN on the event_log query for the ∃ and ∀ guards shows no full-table scan (no "SCAN TABLE event_log" without an index on evt_id or type)
    And the guard uses the index on (type, evt_id) to filter "objection" rows with evt_id >= consensusRoundStart without scanning pre-epoch rows
    And the p95 budget is committed to performance-baselines.json under key "moderator_emits_candidate_guard_p95_ms" with an associated baseline key "moderator_emits_candidate_guard_baseline_rows" recording the eventLog row count at baseline capture time
    And the CI job fails if the guard evaluation increases p95 by more than 20% versus the baseline for the same eventLog row count

  @quality_attribute @boundary
  Scenario: evt_id allocator burst envelope accounts for fan-out peaks exceeding aggregate throughput floor
    Given the router dispatches a debate round to 8 reviewers generating 2 events each (16 evt_id allocations in a burst within a single sub-second window)
    When the allocator is called 16 times in rapid succession during the fan-out burst
    Then all 16 allocations complete within 200 milliseconds (burst window)
    And the burst throughput (16 allocations ÷ window) exceeds the sustained aggregate rate floor of 50 evt/s
    And the per-caller throughput floor under the burst is ≥ 31 allocations/second (500 allocator/s ÷ 16 callers = 31.25/caller as documented in performance-baselines.json under key "evt_id_allocator_per_caller_floor_allocs_per_sec")
    And the burst-envelope test is run separately from the sustained-throughput test and is committed as a distinct baseline key "evt_id_allocator_burst_16_wall_clock_ms"

  @quality_attribute @boundary
  Scenario: MaxEvtId model-to-production gap is cross-wired — evt_id overflow halt (exit 16) maps to TLA+ MaxEvtId model boundary
    Given the TLA+ model uses MaxEvtId=4 (as configured in BidirectionalComms.cfg) and production uses Int64.MaxValue
    When the production router's evt_id allocator approaches Int64.MaxValue-1
    Then the router detects the boundary condition (nextEvtId > Int64.MaxValue - 1) and halts with failureCategory="evt_id_overflow" and exit code 16
    And the RouterHaltsBoundReached action in BidirectionalComms.tla v10 (which fires at nextEvtId > MaxEvtId) is structurally identical at MaxEvtId=4 and Int64.MaxValue — the guard logic is parameterized, not hardcoded
    And a test verifies the boundary condition is exercised in the property test suite using MaxEvtId=4 (the model constant), proving the production guard is covered without requiring a 9.2×10^18 event sequence
    And tests/bus/performance-baselines.json documents this gap under key "evt_id_model_max" (value: 4) and "evt_id_production_max" (value: 9223372036854775807) for provenance

# =============================================================================
# Item 28 — Branch Hygiene and Commit Idempotency
# =============================================================================

Feature: The feature branch produced by the bus maintains clean git history
  Trailers are preserved; squash policy is defined; duplicate commits from resume are prevented

  @primary @integration
  Scenario: Each done event produces exactly one commit with a Vibe-Event-Id trailer
    Given Stage 7 processes 10 done events across 4 tasks
    When git log is inspected on the feature branch
    Then there are at most 10 commits carrying Vibe-Event-Id trailers
    And each Vibe-Event-Id value is unique in git history

  @primary @integration
  Scenario: Vibe-Event-Id and Vibe-Group-Id trailers are present in git log after squash
    Given the feature branch has multiple micro-commits from Stage 7
    And the branch is squashed before PR creation
    When the squashed commit message is inspected
    Then it includes all unique Vibe-Event-Id values from the squashed commits
    And it includes all unique Vibe-Group-Id values from the squashed commits

  @primary @integration
  Scenario: Resume does not produce duplicate commits for already-committed events
    Given a pipeline crashed and is resumed via -Resume
    And event_log contains events evt-001 through evt-015 with status="committed"
    When the resumed pipeline runs
    Then git log shows no new commits carrying Vibe-Event-Id values from evt-001 through evt-015
    And only events with status other than "committed" produce new commits

  @primary @integration
  Scenario: Vibe-Event-Id values are globally unique across recent repository git history with a bounded scan
    Given the CI job "vibe-event-id-global-uniqueness" runs on every pull request and merge to main
    When the job scans for Vibe-Event-Id trailers
    Then the scan is bounded to commits reachable from the current HEAD within the last 90 days using "git log --since=90.days.ago --all --format=%B" to prevent an unbounded O(repo-history) scan on every PR
    And the job explicitly does NOT use an unbounded "git log --all" without a date or count scope limit
    And all commit messages containing "Vibe-Event-Id:" trailers within the scoped window are extracted
    And no Vibe-Event-Id value appears more than once across the extracted set
    And the CI job fails if any Vibe-Event-Id value is duplicated in the scoped history
    And the evt_id allocation strategy (SQLite AUTOINCREMENT scoped to the pipeline run) makes global collisions structurally impossible; the CI check is a defensive regression gate scoped to a reasonable history window

  @primary @integration
  Scenario: New-BusSnapshot creates a snapshot row after each successfully committed done event
    Given an agent emits a done event for task "task-07" that is committed to git by the commit serializer
    When the commit serializer updates event_log status to "committed" for that done event
    Then New-BusSnapshot is called automatically after the status update
    And New-BusSnapshot inserts one row into the bus_snapshots table with fields: snap_id (UUID v4), feature_name, git_sha (the commit SHA produced by the done event), last_committed_evt_id (the committed evt_id), and taken_at (UTC ISO 8601)
    And the bus_snapshots table is separate from event_log and is not governed by the append-only trigger
    And the snap_id is globally unique across all rows in bus_snapshots

  @primary @integration
  Scenario: New-BusSnapshot is triggered once per successfully committed done event and not on failed or rolled-back events
    Given a done event commits successfully (status="committed") and another done event fails (status="routed", commit failed)
    When the commit serializer processes both events
    Then New-BusSnapshot is called exactly once — for the committed event only
    And no snapshot row is created for the failed event
    And no snapshot row is created for events with status="routed", "rejected", or "delivery_failed"

  @primary @integration
  Scenario: Snapshot retention policy removes old snapshots beyond the configured limit
    Given the bus_snapshots retention limit is configured at 10 snapshots per feature (default, not hardcoded)
    And bus_snapshots already contains 10 rows for feature "auth-flow"
    When New-BusSnapshot is called for the 11th committed done event for "auth-flow"
    Then the oldest snapshot row for "auth-flow" (the row with the smallest snap_id or earliest taken_at) is deleted before the new row is inserted
    And bus_snapshots never contains more than the configured retention limit of rows per feature
    And the retention limit is stored in vibe configuration, not hardcoded in New-BusSnapshot

  @quality_attribute @integration
  Scenario: New-BusSnapshot p95 cost does not inflate commit-serializer tail latency above baseline
    Given the commit serializer holds the per-worktree mutex and calls New-BusSnapshot synchronously after each done commit
    And the test measures total commit-serializer wall-clock time for 20 consecutive done commits (baseline: serializer-only without New-BusSnapshot) and with New-BusSnapshot enabled
    When New-BusSnapshot completes its SQLite INSERT plus UUID-v4 generation and optional eviction DELETE
    Then the p95 New-BusSnapshot wall-clock cost per commit does not exceed the bound committed to tests/bus/performance-baselines.json under key "new_bus_snapshot_p95_ms"
    And enabling New-BusSnapshot does not increase the commit-serializer p95 tail latency by more than 20% over the baseline commit-only measurement
    And this 20% budget is the same regression gate used for the commit-serializer itself — no special budget expansion for snapshot cost
    And the CI job fails if the New-BusSnapshot cost exceeds the baseline-relative cap, reporting "New-BusSnapshot inflated commit tail latency by X% (limit 20%)"

  @primary @integration @failure_recovery
  Scenario: /rollback CLI surface — vibe.ps1 accepts -Rollback -SnapId <snap_id> as a named parameter
    Given the repository is in a state where bus_snapshots contains at least one snapshot for feature "auth-flow"
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-003"
    Then vibe.ps1 treats -Rollback as a distinct switch parameter (not -Resume, not -Status) that initiates the rollback workflow
    And -SnapId is a mandatory companion parameter to -Rollback identifying the target snapshot by its snap_id UUID
    And providing -Rollback without -SnapId produces an error message "Missing -SnapId: specify the target snapshot ID" and exits non-zero
    And providing -SnapId without -Rollback is treated as a parameter error and exits non-zero
    And the parameter contract is: ./vibe.ps1 -Rollback -SnapId <uuid> (no positional seed argument, no -Resume, no -Status may be combined with -Rollback)
    And the parameter block in vibe.ps1 formally declares -Rollback as a [switch] and -SnapId as a [string] with ParameterSetName="Rollback"

  @primary @integration @failure_recovery
  Scenario: /rollback command restores the feature branch to a prior snapshot and halts cleanly — event_log is NOT mutated
    Given a pipeline is running (busStatus="running") for feature "auth-flow" with the commit lock idle (all commitLockHolder[wt] = null)
    And bus_snapshots contains a row snap-003 with git_sha="abc123" and last_committed_evt_id="evt-042"
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-003" (which internally sets rollbackRequested=TRUE)
    Then the bus waits for all in-flight commits to drain (commits that were already in-progress complete; no new commits are accepted after rollbackRequested=TRUE is observed)
    And the bus calls Stop-AllBusAgents once commitLockHolder[wt] = null for all worktrees
    And the feature branch for "auth-flow" is reset to the git commit SHA "abc123" recorded in snap-003 (git reset --hard abc123 on the feature branch)
    And the router resets its in-memory state: committedDoneEvts is scoped to events with evt_id <= "evt-042", commitLockHolder is cleared, pendingDoneEvt is cleared — consistent with TLA+ RouterExecutesRollback action
    And event_log is NOT mutated — no rows are marked status="rolled_back" and no new "rollback_requested" event is appended (event_log is append-only and does not contain a "rollback_requested" type in the 16-value closed enum)
    And agent_sessions rows created after the snapshot point have status="ended" with ended_at set to the rollback timestamp (agent-lifecycle mutation is permitted; event_log mutation is not)
    And the pipeline halts with haltReason="user_rollback" and exits with code 0
    And a subsequent "./vibe.ps1 -Resume" re-spawns agents from the snapshot's bootstrap + ground_truth derived from SQLite state as of snap-003

  @negative @integration
  Scenario: /rollback is rejected when no snapshot exists for the target worktree (RollbackRequiresSnapshot)
    Given bus_snapshots contains zero rows for feature "auth-flow" (no snapshot has been taken yet)
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-003"
    Then the router detects that no snapshot exists matching snap_id="snap-003" in bus_snapshots
    And the rollback is rejected with an error message "Rollback rejected: snapshot snap-003 not found in bus_snapshots for feature auth-flow"
    And the pipeline does NOT halt or modify any state
    And the process exits non-zero
    And this behavior satisfies the RollbackRequiresSnapshot invariant (TLA+ v8 OBJ-10)

  @negative @edge_case
  Scenario: /rollback against a halted bus is auto-aborted via RouterAbortsStaleRollback — the halt reason is preserved and snapshot retained
    Given the bus has already halted with haltReason="mechanical_error" and failureCategory="agent_crash" (busStatus="halted")
    And snapshotExists["wt-auth-flow"]=TRUE
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-003" (UserRequestsRollback fires, setting rollbackRequested=TRUE)
    Then RouterExecutesRollback does NOT fire because busStatus is not "running" (BusRunning guard required)
    And RouterAbortsStaleRollback fires (v11 OBJ-C: busStatus="halted" ∧ rollbackRequested=TRUE) and clears rollbackRequested to FALSE and rollbackTargetWorktree to NULL
    And snapshotExists["wt-auth-flow"] remains TRUE — snapshot preserved for retry after -Resume
    And busStatus="halted", haltReason="mechanical_error", failureCategory="agent_crash" are all preserved unchanged (RouterAbortsStaleRollback does NOT modify these)
    And consensusRoundStart is NOT advanced (RouterAbortsStaleRollback does not advance the epoch — no clean-slate boundary occurred)
    And the CLI reports user-visible feedback: "Rollback aborted: bus is halted. Run './vibe.ps1 -Resume' first, then re-issue '/rollback' after the bus is running."
    And the process exits with exit code 15 (agent_crash) — the mechanical halt exit code is preserved, not overwritten by RouterAbortsStaleRollback

  @primary @integration
  Scenario: /rollback with worktree-scoped snapshot — only the targeted worktree's branch is reset; other worktrees are unaffected
    Given bus_snapshots contains snap-003 with worktree="wt-auth-flow", git_sha="abc123", and last_committed_evt_id="evt-042"
    And a second worktree "wt-auth-tests" is also active with its own commit history
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-003"
    Then only the "wt-auth-flow" feature branch is reset to "abc123"
    And the "wt-auth-tests" worktree and its git history are not modified
    And snapshotExists["wt-auth-flow"] transitions from TRUE to FALSE after rollback executes (the snapshot is consumed)
    And snapshotExists["wt-auth-tests"] remains unchanged at its prior value
    And this behavior satisfies the worktree-scoped semantics of rollbackTargetWorktree and snapshotExists[w] in TLA+ v9 OBJ-4

  @negative @integration
  Scenario: /rollback is rejected when the target snapshot belongs to a different worktree — cross-worktree rollback rejection (v9 OBJ-4)
    Given bus_snapshots contains snap-005 with worktree="wt-auth-tests", git_sha="def789", and last_committed_evt_id="evt-055"
    And the active pipeline is running for worktree "wt-auth-flow" (a different worktree)
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-005"
    Then the router sets rollbackTargetWorktree="wt-auth-tests" (derived from snap-005's worktree field)
    And the router detects that rollbackTargetWorktree="wt-auth-tests" differs from the primary active worktree "wt-auth-flow"
    And the rollback is rejected with an error message "Rollback rejected: snapshot snap-005 targets worktree wt-auth-tests which is not the current active worktree wt-auth-flow"
    And rollbackRequested is cleared to FALSE and rollbackTargetWorktree is cleared to NULL
    And the pipeline does NOT halt or modify any state
    And the process exits non-zero
    And this behavior satisfies the RollbackRequiresSnapshot invariant: snapshotExists[rollbackTargetWorktree] is only TRUE for the snapshot's own worktree, not for a cross-worktree reference

  @quality_attribute @integration @failure_recovery
  Scenario: /rollback wall-clock cost is bounded under peak steady-state load
    # @skip-until-baseline-present: the three rollback-specific baseline keys
    # (rollback_wall_clock_ms, stop_all_agents_drain_ms, rollback_commit_drain_ms) must be captured
    # via the "capture-baselines" CI job on the first deploy before this gate is activated
    Given the bus is under peak steady-state load: 16 alive agents, 500 pending events in the ConcurrentQueue, a 90-day git log on the feature branch
    When the user invokes "./vibe.ps1 -Rollback -SnapId snap-003" and the router begins the rollback sequence
    Then the total wall-clock time from rollbackRequested=TRUE to haltReason="user_rollback" does not exceed the bound committed to tests/bus/performance-baselines.json under key "rollback_wall_clock_ms"
    And Stop-AllBusAgents drain time — the time from sending stop signals to all agents completing Stop-ProcessTree — does not exceed the bound committed to performance-baselines.json under key "stop_all_agents_drain_ms"
    And the commit-drain phase — waiting for all commitLockHolder[wt]=null — does not block for longer than the bound committed to performance-baselines.json under key "rollback_commit_drain_ms"
    And each of these three bounds is independently measured and committed as a separate baseline key (not aggregated) so regressions are pinpointed

  @primary @integration
  Scenario: Branch-protection rules prevent force-push to the main branch from any actor including CI
    Given the repository's main branch has a branch-protection ruleset configured
    When the branch-protection ruleset is inspected
    Then force-push is disabled for all actors including repository administrators
    And the ruleset requires at least one approving review before merge
    And the ruleset requires all CI status checks named in the required-check list to pass before merge
    And the required-check list includes at a minimum: "atomic-cutover-check", "no-invoke-claude-regression", "bus-merge-queue-contract-check", "vibe-event-id-global-uniqueness", and all performance-test jobs
    And linear history is enforced (merge commits are disallowed; only squash or rebase merges are permitted)
    And a CODEOWNERS file exists at .github/CODEOWNERS defining at minimum: the Bus bounded-context owner (bus/ directory), the Merge-Queue bounded-context owner (and merge-queue source), and the contract file owner (bus/contracts/)
    And the contract file path (bus/contracts/bus-merge-queue-contract.json) requires approval from BOTH the Bus owner and the Merge-Queue owner per CODEOWNERS

  @failure_recovery @edge_case
  Scenario: Stale feature branch from a crashed run is detected and reported on resume
    Given the pipeline crashed mid-run for feature "auth-flow"
    And the feature branch "feature/auth-flow" in the working repository contains commits from the crashed run (commits carrying Vibe-Event-Id trailers beyond the last event_log row with status="committed")
    When the user runs "./vibe.ps1 -Resume"
    Then the router queries git log for "feature/auth-flow" and extracts all Vibe-Event-Id trailer values
    And the router cross-references those values against event_log rows with status="committed"
    And any git commit whose Vibe-Event-Id is absent from event_log status="committed" is identified as a stale orphan commit
    And the router logs a "[WARN]" entry listing the stale orphan commits and their Vibe-Event-Id values
    And the router halts with a mechanical error requiring human decision: the human must either cherry-pick the orphan commits into event_log or git-reset the branch before retrying -Resume
    And the error message explicitly names the affected Vibe-Event-Id values and the required human action

  @failure_recovery @integration
  Scenario: Orphan-commit git-reset recovery path — running Repair-BusBranch -Reset removes orphan commits and unblocks -Resume
    Given the pipeline halted after detecting orphan commits evt-088 and evt-089 on branch "feature/auth-flow"
    And bus_snapshots contains snap-007 with git_sha="def456" and last_committed_evt_id="evt-087" (the last known-good state)
    When the human runs "Repair-BusBranch -Feature auth-flow -Reset -ToSnap snap-007" (the git-reset recovery tool)
    Then Repair-BusBranch runs "git reset --hard def456" on branch "feature/auth-flow"
    And the git commits carrying Vibe-Event-Id values evt-088 and evt-089 are removed from the branch history
    And Repair-BusBranch records the reset in a repair_log entry: {action: "git-reset", feature: "auth-flow", snap_id: "snap-007", removed_evt_ids: ["evt-088", "evt-089"], timestamp: <UTC>}
    And event_log rows for evt-088 and evt-089 (if any exist with status="routed") are updated to status="rejected" via the whitelisted trigger (the rows remain for audit; the branch no longer contains them)
    And after repair completes, "./vibe.ps1 -Resume" succeeds without the orphan-commit detection error

  @failure_recovery @integration
  Scenario: Orphan-commit cherry-pick recovery path — running Repair-BusBranch -CherryPick re-integrates orphan commits into event_log and unblocks -Resume
    Given the same orphan-commit detection state (evt-088, evt-089 on "feature/auth-flow" with no event_log rows)
    When the human runs "Repair-BusBranch -Feature auth-flow -CherryPick -Orphans evt-088,evt-089" (the cherry-pick recovery tool)
    Then Repair-BusBranch inserts rows for evt-088 and evt-089 into event_log with status="committed" and the Vibe-Event-Id values from the git trailers
    And the repair_log records: {action: "cherry-pick", feature: "auth-flow", adopted_evt_ids: ["evt-088", "evt-089"], timestamp: <UTC>}
    And after repair completes, "./vibe.ps1 -Resume" succeeds and the two adopted events are visible in event_log as status="committed"

# =============================================================================
# Item 29 — Pre-Merge Gate Handoff to Stage 7 Merge Queue
# =============================================================================

Feature: The bus signals the Stage 7 merge queue via an observable event_log sentinel
  The merge queue integration boundary is explicit and testable

  @primary @integration
  Scenario: Bus signals merge readiness via an event_log status sentinel
    Given a coding-worker agent for task "task-07" emits a done event that is committed
    And the commit serializer updates event_log status to "committed" for that done event
    When the Stage 7 merge queue queries for ready tasks
    Then it queries event_log WHERE type='done' AND status='committed' to identify tasks ready for merge
    And no additional signal type or sentinel event is required beyond the "committed" status marker

  @primary @integration
  Scenario: Stage 7 merge queue remains authoritative for cross-task conflicts
    Given two tasks "task-01" and "task-02" have both committed their done events
    And merging their branches produces a conflict
    When the merge queue processes the conflict
    Then the merge-queue.Tests.ps1 merge logic resolves it
    And no bus event is emitted for the conflict resolution
    And the bus subsystem does not read from merge_results

  @primary @integration
  Scenario: Bus handoff contract is observable by the merge queue without coupling to bus internals
    Given the Stage 7 merge queue is implemented independently of the bus subsystem
    When the merge queue checks for ready tasks
    Then it reads only from event_log (type, status, group_id columns) and the pre-existing task_results table
    And it does not call any bus public function (Start-BusAgent, Send-BusEvent, etc.)

  @primary @integration
  Scenario: Each FailureCategory maps to a distinct process exit code aligned with TLA+ ExitCodeOf so CI can dispatch without parsing stderr
    Given the bus halts for different FailureCategory values
    When the halt exit code is observed for each category
    Then semantic_termination (consensus_ratified, consensus_failed, feature_complete, user_rollback) exits with code 0
    And user_interrupt (Ctrl+C) exits with code 1
    And duplicate_evt_id exits with code 10
    And group_violation exits with code 11
    And git_commit failure exits with code 12
    And handler_failure exits with code 13
    And sqlite_error exits with code 14
    And agent_crash exits with code 15
    And evt_id_overflow exits with code 16
    And no two FailureCategories share an exit code (there are 7 distinct non-zero codes for 7 FailureCategories)
    And user_rollback exits with code 0 — it is a semantic halt, not a mechanical error, and shares exit code 0 with consensus termination
    And the CI dispatch job checks specific exit codes (10-16) to route each failure category to its dedicated remediation path without parsing stderr
    And the exit code contract is documented in bus/contracts/exit-codes.md committed to the repository
    And exit-codes.md lists all 10 codes (0 for semantic including user_rollback, 1, 10-16) with their corresponding halt reason and failure category
    And RouterAbortsStaleRollback fires post-halt and does NOT change the exit code — the bus is already halted (exit code set by the original halt action: exit 1 for user_interrupt, or 10-16 for mechanical halt); RouterAbortsStaleRollback only clears rollbackRequested and rollbackTargetWorktree in-memory and has no exit-code assignment of its own

# =============================================================================
# Item 30 — Bus Test Seam Contract
# Defines whether stage-level unit tests mock bus functions or run a real bus instance
# =============================================================================

Feature: Stage-level unit tests use a defined seam to interact with the bus
  The contract prevents each stage test from independently inventing its own bus mock

  @primary @integration
  Scenario: Stage-level unit tests mock Send-BusEvent and Wait-BusGroup at the public function boundary with concrete call-record assertions
    Given a unit test for a Stage 4 script is written
    When the test exercises Stage 4 logic that dispatches a verify event to the TLC handler
    Then it replaces Send-BusEvent and Wait-BusGroup with test stubs that record calls and return pre-configured responses
    And the test asserts the stub records exactly one call to Send-BusEvent with parameters: from="tla-writer", to="tlc", type="verify", and a non-null payload
    And the test asserts the stub records one call to Wait-BusGroup with group_id matching the dispatched event's group_id
    And the test asserts the envelope type is "verify" and the "to" field is "tlc" (not an agent name) — verifying the routing rule is applied correctly at the Stage boundary
    And it does not run a real SQLite database or real agent process
    And the stubs conform to the documented parameter signatures of Send-BusEvent and Wait-BusGroup

  @primary @integration
  Scenario: Handler-epoch guard at the stage seam — unit test boundary for HandlerAdapterCompletes epoch check
    Given a unit test for the HandlerAdapter at the Send-BusEvent / Wait-BusGroup boundary is written
    When the test simulates HandlerAdapterCompletes with a stale epoch (handlerPendingEpoch["tlc"]="evt-010" ≠ current spawnedAtEvt="evt-025")
    Then the stub for Wait-BusGroup is NOT called (the epoch check fires before the group resolution)
    And the test asserts the stub records zero calls to Wait-BusGroup
    And the test asserts a mechanical error is signaled to the caller (not a protocol_error)
    And the handler state for "tlc" is recorded as cleared: handlerPendingAgent=null, handlerPendingEvt=null, handlerPendingEpoch=null by the unit under test
    And the stub records precisely the state transitions: HandlerAdapterReceives (epoch recorded) → stale HandlerAdapterCompletes (epoch mismatch detected) → handler cleared → mechanical halt
    And this scenario verifies the unit boundary: the epoch check is in the HandlerAdapter layer, not in Send-BusEvent itself

  @primary @integration
  Scenario: Integration tests run a real bus instance with in-memory SQLite and test doubles
    Given an integration test in tests/bus/integration/ is written
    When the test exercises multi-component behavior (router + agent_sessions + event_log)
    Then it initializes a real bus instance pointing to an in-memory SQLite connection
    And it uses claude-test-double.ps1 and git-test-double.ps1 instead of real binaries
    And it does NOT mock Send-BusEvent or Wait-BusGroup

  @primary @integration
  Scenario: E2E tests run the full bus with on-disk SQLite and test doubles
    Given an e2e test in tests/bus/e2e/ is written
    When the test exercises the full pipeline from Stage 2 through Stage 7
    Then it uses on-disk SQLite (deleted at teardown) and all test doubles
    And it invokes vibe.ps1 directly with a test seed
    And the on-disk SQLite file is deleted regardless of test outcome

# =============================================================================
# Item 31 — Bus→Merge-Queue Published Language Contract
# The Bus and Merge-Queue bounded contexts share a single integration surface.
# That surface is a named Published Language artifact, not an implicit convention.
# Contract file: bus/contracts/bus-merge-queue-contract.json
# =============================================================================

Feature: The Bus→Merge-Queue integration boundary is a named Published Language contract with observable enforcement
  The contract defines exactly which fields the Merge-Queue reads from event_log; no other coupling is permitted

  @primary @integration
  Scenario: The Published Language contract file exists and defines the integration schema
    Given bus/contracts/bus-merge-queue-contract.json is committed to the repository
    When the file is inspected
    Then it contains a "version" field (semantic version string)
    And it contains a "consumer" field identifying "merge-queue"
    And it contains a "producer" field identifying "bus"
    And it contains a "surface" object describing exactly the columns and values the merge-queue is permitted to read: type (must equal "done"), status (must equal "committed"), group_id (nullable)
    And it does not reference any bus public function (Start-BusAgent, Send-BusEvent, etc.) because the merge-queue reads only from SQLite

  @primary @integration
  Scenario: Stage 7 merge queue reads only the columns enumerated in the contract
    Given the Published Language contract at bus/contracts/bus-merge-queue-contract.json defines the permitted columns as type, status, and group_id
    When the Stage 7 merge-queue SQL queries event_log to identify ready tasks
    Then the query selects only columns listed in the contract surface (type, status, group_id, plus a task identifier)
    And no query from the merge-queue reads from agent_sessions, checkpoint_json, from, to, in_reply_to, payload, or any other column not in the contract

  @primary @integration
  Scenario: A CI job enforces that merge-queue code does not access columns outside the Published Language contract
    Given the contract at bus/contracts/bus-merge-queue-contract.json is committed
    When a CI job named "bus-merge-queue-contract-check" runs
    Then it parses the merge-queue source files for SQL queries against event_log
    And it fails if any query references a column not listed in the contract's surface object
    And it fails if the merge-queue source files import or call any bus public function (Start-BusAgent, Stop-BusAgent, Send-BusEvent, Wait-BusGroup, Register-BusHandler, Get-BusStatus, Stop-AllBusAgents)
    And the CI job failure message identifies the offending file, line number, and the out-of-contract column or function name

  @primary @integration
  Scenario: Changing the contract version requires an explicit review step in the PR description
    Given the Published Language contract is at version "1.0.0"
    When a pull request modifies bus/contracts/bus-merge-queue-contract.json and increments the version
    Then the CI job named "bus-merge-queue-contract-check" detects the version change
    And it adds a "[CONTRACT CHANGE]" annotation to the PR status check summary
    And both the Bus and Merge-Queue owners must acknowledge the change before the PR merges (enforced by required reviewers on the contract file path)

  @negative @integration
  Scenario: A merge-queue query that joins event_log with agent_sessions is rejected by the contract check
    Given the merge-queue source contains a SQL query that joins event_log with agent_sessions on session_id
    When the CI contract-check job runs
    Then it fails because agent_sessions is not in the Published Language contract surface
    And the failure message identifies the join as an out-of-contract coupling

  @primary @integration
  Scenario: A backward-compatible contract surface addition requires a minor version bump
    Given bus/contracts/bus-merge-queue-contract.json is at version "1.0.0"
    When a pull request adds a new optional column to the contract surface
    Then the version must be bumped to at least "1.1.0" (minor bump for backward-compatible addition)
    And the CI "bus-merge-queue-contract-check" job fails if the PR modifies the surface object without bumping the version
    And the version field must match the semver regex "^\\d+\\.\\d+\\.\\d+$"; any non-semver string is a CI failure
    # Scope note: the surface schema versioned by this contract covers event_log columns the merge-queue is permitted
    # to read (type, status, group_id). It does not version the internal bus Envelope value object.

  @primary @integration
  Scenario: A breaking contract surface change (column removal or constraint change) requires a major version bump
    Given bus/contracts/bus-merge-queue-contract.json is at version "1.1.0"
    When a pull request removes a column or changes the required value constraints in the contract surface
    Then the version must be bumped to at least "2.0.0" (major bump for breaking change)
    And the CI job adds a "[BREAKING CONTRACT CHANGE]" annotation to the PR status check summary
    And the CI job requires both the Bus bounded-context owner and the Merge-Queue bounded-context owner to approve the PR before it can merge (enforced via CODEOWNERS on bus/contracts/)
    And the version field must match the semver regex "^\\d+\\.\\d+\\.\\d+$"; any non-semver string is a CI failure

# =============================================================================
# Item 32 — Event Log Append-Only Invariant vs Status Transitions
# Resolution: specific status transitions are whitelisted UPDATEs in the SQLite trigger
# The "append-only" guarantee holds for INSERT and DELETE; UPDATE is permitted only for
# the whitelisted column (status) and only for the whitelisted transition set.
# =============================================================================

Feature: The event_log is append-only for rows and deletion-forbidden; status transitions are the sole permitted UPDATE
  The append-only trigger enforces row immutability except for the status column via whitelisted transitions

  @primary
  Scenario: The event_log append-only trigger permits only whitelisted status transitions via UPDATE
    Given the event_log table has a SQLite trigger enforcing the append-only invariant
    When the trigger definition is inspected
    Then the trigger raises an error on any DELETE against event_log (unconditionally)
    And the trigger raises an error on any UPDATE that changes a column other than "status"
    And the trigger raises an error on any UPDATE to status that is not in the whitelisted transition set
    And the whitelisted status transitions are exactly: "routed" → "committed", "routed" → "delivery_failed", "routed" → "rejected"
    And the transition "routed" → "rolled_back" does NOT exist — event_log rows are never marked "rolled_back" because rollback is a git-branch-level operation that does not mutate event_log (event_log is append-only; RouterExecutesRollback resets in-memory state only)
    And any UPDATE attempting "committed" → "routed" or any other non-whitelisted direction is rejected by the trigger
    And INSERT operations are always permitted (the append guarantee holds for new rows)

  @primary
  Scenario: The event_log trigger rejects an UPDATE that changes the from, to, type, or payload columns
    Given event_log contains a row with evt_id="evt-042" and type="done"
    When an UPDATE statement attempts to change the "type" column of evt_id="evt-042" to "review_requested"
    Then the trigger fires and the UPDATE is rejected with an error
    And event_log row for evt_id="evt-042" retains type="done" unchanged
    And the "append-only" claim in the glossary is accurate: rows cannot be modified except for the whitelisted status column transition

  @negative
  Scenario: A test asserts that issuing an unrestricted UPDATE against event_log causes the trigger to fire
    Given event_log contains a row with evt_id="evt-001" and status="routed"
    When "UPDATE event_log SET status='deleted' WHERE evt_id='evt-001'" is executed (non-whitelisted transition)
    Then the trigger fires and the statement fails
    And event_log row for evt_id="evt-001" retains status="routed" unchanged

# =============================================================================
# Item 33 — Envelope Robustness: Payload Size Cap, Unicode Normalization,
#           In-Reply-To Cycle Detection
# =============================================================================

Feature: The router enforces envelope robustness invariants to prevent OOM, encoding attacks, and infinite correlation chains
  Every envelope is checked for payload size, type-field encoding, and in_reply_to acyclicity before appending to event_log

  @primary @boundary
  Scenario: Envelope payload exceeding the configured size cap is rejected with protocol_error
    Given the router's envelope payload size cap is configured at 1 MB (1048576 bytes) — configurable, not hardcoded
    When an agent sends an envelope whose serialized payload is 1048577 bytes
    Then the router rejects the envelope with a protocol_error to the sender identifying "payload size exceeds cap"
    And the oversized envelope is NOT appended to event_log
    And the pipeline does not halt
    And the size cap is stored in vibe configuration and applied uniformly to all event types

  @negative @boundary
  Scenario: Envelope payload at exactly the size cap boundary is accepted
    Given the router's envelope payload size cap is 1 MB
    When an agent sends an envelope whose serialized payload is exactly 1048576 bytes
    Then the router accepts the envelope without emitting a protocol_error
    And the envelope is appended to event_log normally

  @negative @boundary
  Scenario: An envelope type field containing a Unicode escape that decodes to a valid type name is rejected
    Given an agent sends an envelope with type="protocol\u005Ferror" (which decodes to "protocol_error" after Unicode unescaping)
    When the router validates the type field
    Then the router rejects the envelope with a protocol_error identifying the raw type value "protocol\u005Ferror" as non-conforming
    And the router enforces that the type field must be NFC-normalized printable ASCII with no Unicode escapes or non-ASCII characters
    And no envelope whose type field requires Unicode decoding to match a known type is ever accepted

  @negative @boundary
  Scenario: NFC normalization is enforced on the from and to fields in addition to the type field
    Given an agent sends an envelope with from="tla\u2010writer" (where \u2010 is the Unicode non-breaking hyphen, visually identical to ASCII hyphen in "tla-writer")
    When the router validates the from field
    Then the router rejects the envelope with a protocol_error identifying the from field as containing non-ASCII characters (\u2010 is not ASCII)
    And a separate send with to="tla\u2010writer" (same Unicode hyphen in the to field) is likewise rejected before lookup
    And "tla\u2010writer" and "tla-writer" are treated as DISTINCT agents: the Unicode-hyphen form is always rejected, never auto-normalized to the ASCII form (normalization is a rejection, not a coercion)
    And the router does NOT silently apply NFC normalization to from/to values and proceed — it rejects any from or to field that contains non-ASCII characters with a protocol_error
    And this prevents a unicode-hyphen spoofed from address from impersonating a legitimate agent name in the router's agent_sessions lookup

  @negative @boundary
  Scenario: An envelope type field containing non-ASCII or control characters is rejected
    Given an agent sends an envelope with type="protocol_error\x00" (with a null byte appended)
    When the router validates the type field
    Then the router rejects the envelope with a protocol_error identifying the type field as containing non-printable characters
    And the envelope is not appended to event_log

  @negative @boundary
  Scenario: An envelope with in_reply_to forming a direct cycle (A→B→A) is rejected with protocol_error
    Given event_log contains evt_id="evt-010" with in_reply_to="evt-012"
    And evt_id="evt-012" with in_reply_to="evt-010" (forming a cycle evt-010↔evt-012)
    When an agent sends a new envelope with in_reply_to="evt-012"
    Then the router walks the in_reply_to chain from "evt-012" and detects the cycle back to "evt-010"
    And the router rejects the envelope with a protocol_error identifying "in_reply_to cycle detected: evt-012 → evt-010 → evt-012"
    And the envelope is not appended to event_log

  @negative @boundary
  Scenario: An envelope with in_reply_to referencing its own evt_id (self-reply) is rejected with protocol_error
    Given an agent constructs an envelope with evt_id="evt-099" and in_reply_to="evt-099" (self-reply)
    When the router validates the envelope
    Then the router detects the self-reply condition (in_reply_to equals the envelope's own evt_id)
    And the router rejects the envelope with a protocol_error identifying "in_reply_to self-reference: evt-099"
    And the envelope is not appended to event_log

# =============================================================================
# Item 34 — Stdout-Reader Runspace Crash Recovery
# (Missing scenario: runspace faulted while the agent process is still alive)
# =============================================================================

Feature: The router handles a faulted stdout-reader runspace that dies while the agent process is still alive
  A crashed runspace is detected and treated as a mechanical error requiring halt

  @failure_recovery @edge_case
  Scenario: Stdout-reader runspace faults while the agent process is alive — detected and escalated
    Given agent "tla-writer" is alive with PID 6789 and its stdout-reader runspace is running
    When the runspace faults (e.g., an unhandled exception in the ReadLine loop, runspace state transitions to "Broken")
    Then the router's runspace-health monitor detects that the runspace for "tla-writer" has reached the "Broken" state
    And the router confirms that PID 6789 is still alive in the OS process list (the process is not dead)
    And the router treats the faulted runspace as a mechanical error (not an agent crash, because the agent is alive but unreadable)
    And the router halts with failureCategory="agent_crash" (the unreadable stdout is operationally equivalent to an agent crash from the bus's perspective)
    And the process exits with exit code 15 (the exit code for failureCategory="agent_crash" per Item 29's exit-code contract — stdout-reader runspace faults map to agent_crash, not handler_failure or sqlite_error)
    And the router calls Stop-AllBusAgents including Stop-ProcessTree(6789) to terminate the still-running agent
    And the error log identifies "stdout-reader runspace faulted (runspace.RunspaceStateInfo.State = Broken) for agent tla-writer PID 6789" as the cause
    And final SQLite state is written before the halt

  @failure_recovery @edge_case
  Scenario: -Resume after a faulted-runspace halt re-spawns the agent whose runspace faulted
    Given the pipeline halted due to a faulted stdout-reader runspace for "tla-writer"
    And agent_sessions shows "tla-writer" with status="ended" (crash-reconciled)
    When the user runs "./vibe.ps1 -Resume"
    Then the router spawns a fresh stdout-reader runspace for the new "tla-writer" process
    And the router delivers bootstrap + ground_truth (and checkpoint_response if available) to the new process
    And the new runspace starts in "BeforeOpen" → "Opened" state (not "Broken")
    And no second faulted-runspace condition exists until the runspace is confirmed healthy

# =============================================================================
# Item 35 — CI Job Matrix and Tag-to-Job Mapping
# =============================================================================

Feature: The CI job matrix maps tagged scenario collections to parallel jobs with defined shared fixtures
  Every tag combination has a designated CI job so all scenarios run in CI without serial bottlenecks

  @primary @integration
  Scenario: The CI job matrix file exists and maps every scenario tag to a CI job
    Given the CI configuration at .github/workflows/bus-tests.yml is inspected
    When all tagged scenario groups are enumerated
    Then every tag in the taxonomy (@primary, @negative, @edge_case, @data_driven, @integration, @quality_attribute, @failure_recovery, @boundary, @unit) maps to at least one named CI job
    And the @unit job runs scenarios tagged @unit in isolation with no SQLite or process spawning
    And the @integration job runs scenarios tagged @integration with in-memory SQLite and test doubles
    And the @quality_attribute job runs performance scenarios in the dedicated CI performance environment matching the runner_spec in performance-baselines.json
    And the @failure_recovery job runs crash-recovery and resume scenarios with on-disk SQLite (deleted at teardown)
    And the @properties job runs property-based test scenarios from tests/bus/properties/
    And the @traces job runs trace-replay scenarios from tests/bus/traces/
    And the job matrix specifies which test fixture files are shared across parallel test workers within each job to prevent fixture-collision

  @primary @integration
  Scenario: The @unit and @integration CI jobs run in parallel within their job category
    Given the CI configuration at .github/workflows/bus-tests.yml uses a matrix strategy for test parallelism
    When a pull request targets the main branch
    Then the @unit scenarios run in parallel across at least 2 workers within the unit job
    And the @integration scenarios run in parallel across at least 4 workers within the integration job
    And each parallel worker uses a unique mutex-naming prefix (e.g., "CI-<run_id>-<worker_id>") to prevent cross-worker mutex collision
    And the parallelism count per job is committed in the workflow file and not hardcoded to 1

# =============================================================================
# Item 36 — Deployment Observability
# (No canary, no shadow — post-deploy detection is the sole safety net)
# =============================================================================

Feature: Post-deployment observability provides the sole safety net in the absence of canary or shadow modes
  Alerts, health checks, and smoke tests detect production regressions after the atomic cutover

  @primary @integration
  Scenario: A post-deploy smoke test verifies the bus is operational after deployment
    Given the bidirectional-comms feature has been deployed to the production pipeline environment
    When the post-deploy smoke test named "bus-smoke-test" runs automatically after deployment
    Then the smoke test spawns a dedicated synthetic feature named "smoke-test-<deploy_id>" (not the most recently active user feature — polling an already-halted user feature pollutes the deploy-health signal with stale state)
    And the smoke test invokes Start-BusAgent to spawn a claude-test-double agent under the synthetic feature
    And the smoke test invokes Send-BusEvent to route a bootstrap event to the synthetic agent and verifies the event appears in event_log with status="routed"
    And the smoke test invokes Get-BusStatus against the synthetic feature's SQLite database and verifies busStatus="running"
    And the synthetic feature's SQLite database and agent_sessions rows are deleted after the smoke test completes (cleanup is mandatory to avoid polluting the production database with smoke-test data)
    And the smoke test completes within 60 seconds and exits non-zero if any check fails
    And a failed smoke test triggers an immediate alert to the on-call channel

  @primary @integration
  Scenario: An operational alert fires when the pipeline halts unexpectedly (mechanical error)
    Given the pipeline is running and Write-PipelineLog is writing to the production log file
    When the router halts with failureCategory set to any FailureCategory value (exit codes 10-16)
    Then Write-PipelineLog records a final "[HALT]"-level entry identifying the failureCategory, exit code, and last event_log evt_id before halt
    And the pipeline's process supervisor (e.g., a PowerShell watchdog or CI job) detects the non-zero exit code
    And an alert is sent to the on-call channel within 5 minutes of the halt
    And the alert message includes: feature name, failureCategory, exit code, and a link to the pipeline-log.ps1 file

  @primary @quality_attribute
  Scenario: A post-deploy rollout health metric is captured, validated, and retained for comparison with subsequent deployments
    Given the first successful pipeline run after the bidirectional-comms deployment completes
    When the pipeline exits with code 0 (semantic termination)
    Then the router writes a metrics.json file to the pipeline state directory containing at minimum: "total_run_duration_ms" (integer), "total_events_routed" (integer), "final_alive_agent_count" (integer), "pipeline_exit_code" (integer)
    And the CI post-deploy step validates that metrics.json parses as valid JSON and that all four required keys are present with non-null values — the step fails if any key is missing or null
    And these metrics are accessible via "./vibe.ps1 -Status" for ad-hoc inspection
    And the CI step fails explicitly if metrics.json is absent after a code-0 exit, reporting "metrics.json not written — deployment health check failed"

  @primary @quality_attribute
  Scenario: metrics.json is compared against the prior successful deploy to catch cross-deploy regressions (the sole safety net absent canary/shadow modes)
    Given the current deployment has produced a metrics.json with total_run_duration_ms=45000 and total_events_routed=320
    And the prior successful deployment's metrics.json is retained in the pipeline state directory under the naming convention "metrics-<deploy_id>.json"
    When the CI post-deploy comparator job runs
    Then it locates the most recent prior metrics.json (by deploy_id) from the same pipeline state directory
    And it compares total_run_duration_ms: a regression of more than 25% versus the prior deploy is a CI failure
    And it compares total_events_routed: a drop of more than 20% versus the prior deploy (for equivalent feature complexity) is a CI warning
    And the comparator reports results as a CI annotation distinguishing: "REGRESSION" (hard fail), "DEGRADED" (warning), "IMPROVED" (informational), "UNCHANGED" (pass)
    And if no prior metrics.json exists (first deploy), the comparator skips comparison and logs "no prior baseline for cross-deploy comparison — skipping"
    And the comparator job is a required post-deploy step for all production deployments; its absence is itself a CI failure
    # Enforcement boundary (O-CD-2): the bus-smoke-test and metrics.json comparator are POST-DEPLOY checks.
    # They are enforced by the deploy pipeline (not by branch protection / required-check list on PRs).
    # Branch protection covers pre-merge CI jobs: "atomic-cutover-check", "no-invoke-claude-regression",
    # "bus-merge-queue-contract-check", "vibe-event-id-global-uniqueness", and all performance-test jobs.
    # Post-deploy checks (bus-smoke-test, metrics.json comparator) are a deploy-pipeline gate, not a PR gate.
    # This boundary is intentional: post-deploy checks require a live environment unavailable at PR time.

  @primary @invariant-18 @tla-action-AgentSendsDone
  Scenario: TypeSenderACL prevents an unauthorized role from sending a restricted event type
    Given the bus is running with the TypeSenderACL table populated from event-types.psd1
    And a coding-worker agent attempts to send a "verify" event (which only the tla-writer role is authorized to send)
    When the router receives the event for dispatch
    Then the router rejects the send and records an ACL violation in the event-log with status "delivery_failed"
    And the invariant @invariant-18 holds: no event is routed whose (eventType, senderRole) pair is absent from TypeSenderACL

  @primary @invariant-21
  Scenario: A stale objection from a previous consensus epoch is discarded when received after the round advances
    Given a consensus round with consensus epoch = N is currently open
    And an objection event tagged with consensus epoch = N-1 arrives at the router after the epoch has advanced
    When the consensus aggregate processes the stale objection
    Then the objection is discarded and the unresolvedObjections set for epoch N is unchanged
    And the invariant @invariant-21 holds: ConsensusRoundStartMonotone — no state transition accepts an event whose consensus epoch is less than the current RoundEpoch

  @primary @invariant-22
  Scenario: NoOrphanedHandlerForDeadAgent is preserved after an agent crash
    Given an agent-A is registered with status="alive" and has a handler subscribed to its delivery queue
    When agent-A's process exits abnormally and the router marks its session status="dead"
    Then the router unsubscribes agent-A's handler from the bus event pump within one tick
    And the invariant NoOrphanedHandlerForDeadAgent holds: no handler remains registered for an agent whose session status is "dead" or "ended"
