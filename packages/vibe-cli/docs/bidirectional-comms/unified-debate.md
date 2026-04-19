# Unified Debate Session

**Date:** 2026-04-18
**Rounds:** 10
**Result:** PARTIAL_CONSENSUS

## Round 1

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-bdd, expert-tla, expert-edge-cases, expert-tdd, expert-ddd, expert-continuous-delivery, expert-performance

### Objections
- [tla] Group aggregate removed entirely (v4 comment line 53) but BDD Item 7 has 6 scenarios on fan-out including duplicate-reply and non-member-reply as mechanical halts. RouterHaltsGroupViolation is unguarded and proves nothing. Restore groupMembers, groupReplies, WaitGroupResolves action — or document why removal is sound.
- [tla] AppendEvent (line 190) discards from, inReplyTo, and groupId. Role-based routing invariants (BDD Item 6), group fan-out invariants (BDD Item 7), and objection-response correlation (BDD Item 14) are unverifiable. At minimum preserve from; preserving groupId and inReplyTo unlocks the most safety-critical BDD invariants.
- [tla] Hybrid-consensus override (BDD Item 14) unmodeled. RouterRatifiesConsensus requires unresolvedObjections = {} unconditionally; spec rejects valid behavior. Add overriddenObjections set and weaken RatificationRequiresNoObjections. Also add separate moderatorVote and routerVote to model dual-agreement explicitly.
- [tla] Protocol-error self-correction not modeled. RouterEmitsProtocolError emits but no agent action consumes it and corrects. ProtocolErrorIsNonTerminal is a tautology (subsumed by OnlyDefinedHalts). Add pendingProtocolError per agent + corrective action + ProtocolErrorEventuallyResolved liveness property.
- [tla] Ground-truth injection (BDD Item 11) not modeled. DeliverGroundTruth has no precondition tying it to 'before each user message'. Add GroundTruthPrecedesAgentMessage invariant: for every non-bootstrap event with to=a, a ground_truth event for a exists with lower evt_id since last reset.
- [tla] -Resume / crash recovery not modeled. RouterRespawnsAgent only after checkpointStored, not after AgentCrashes. BDD Item 10 treats this as principal recovery surface. Add RouterResumesAgent(a) enabled when agentStatus[a]='dead' and ~checkpointStored[a]; add commit-idempotency safety property.
- [tla] CommitMutexHolds (commitLock[w] in BOOLEAN) is a tautology — already enforced by TypeOK. Real mutex invariant requires tracking holder identity: if commitLock[w] = TRUE, exactly one agent holds it.
- [tla] Fairness incomplete. WF_vars(DeliverBootstrap) is specified but not WF_vars(RouterAssignsWorktree) or WF_vars(AgentSendsDone). Alive agent may never get a worktree, making CommitLockEventuallyReleased vacuous.
- [tla] AgentCheckpointResponse conflates voluntary checkpoint teardown with crash death (both transition to 'dead'). Introduce a 'renewing' agent status distinct from 'dead' so the in-between checkpoint→respawn window is modellable and observable.
- [tla] Handler failure modes not modeled. HandlerReturnsVerifyResult always succeeds; no action for TLC binary missing (BDD line 483), tests handler nonzero exit, or unknown handler target (BDD Item 17 lines 812-817). Add HandlerFails(h) action transitioning to mechanical_error halt.
- [tla] RouterCommitComplete releases the mutex unconditionally with no success/failure distinction. BDD Item 15 says 'git commit failure outside Stage 7 halts the pipeline' but this cannot be proven. Split into RouterCommitSucceeds and RouterCommitFails.
- [tla] Mechanical-error halt reasons collapsed — RouterHaltsGroupViolation, RouterHaltsDuplicateId, RouterHaltsGitCommitFailure, AgentCrashes all map to 'mechanical_error'. BDD distinguishes these. Add failureCategory variable or split HaltReasons so safety properties can assert which condition fired.
- [tla] Terminology drift: eventLog (BDD glossary line 10) renamed to deliveries in TLA+ (a term absent from BDD). Either rename deliveries back to eventLog or add deliveries to the BDD glossary — domain experts reading both will otherwise believe these are different concepts.
- [tla] RouterAssignsWorktree added purely to make AgentSendsDone reachable, but has no BDD counterpart (BDD treats worktree as implicit precondition). Either add a BDD scenario for worktree assignment, or remove the action and model worktree as immutable spawn-time attribute.
- [tla] RouterHaltsFeatureComplete and RouterHaltsGroupViolation have no preconditions beyond BusRunning — always enabled, TLC explores halting at every step. Add real preconditions (feature_complete requires consensus_ratified; group_violation requires a concrete group-state predicate) or annotate as always-enabled by design.
- [tla] Handler dispatch lacks an ACL representation — AgentSendsVerify and HandlerReturnsVerifyResult treat handlers as peers indistinguishable from agents. Distinguish a handler-invocation boundary (raw payload) from the verify_result envelope (translated) so the anti-corruption layer is visible.
- [bdd] Items 1 (Bus Subsystem Layout, lines 49-94), 2 (Agent Spawn flags, lines 103-119), and 21 (Deleted Utilities) are implementation-focused — directory paths, CLI flag strings, ProcessStartInfo properties, file existence. These belong in architecture docs. Rewrite as outcome-focused scenarios a stakeholder can verify.
- [bdd] No scenario tag taxonomy applied. Add @primary, @negative, @edge_case, @data_driven, @integration, @quality_attribute, @failure_recovery, @boundary tags per the expert-bdd role so category coverage is visible at a glance.
- [bdd] No Scenario Outlines used despite obvious data-driven candidates: 15 event types (Item 5), 3 handlers (Item 17), 3 halt reasons (Item 9), writer/coder/reviewer lifetime variations (Item 16). Collapsing these shrinks the file and exposes coverage gaps.
- [bdd] Test infrastructure under-specified. tests/bus/properties/ and tests/bus/traces/ directories exist (Item 1) but no scenarios describe what properties are tested, trace file format, capture trigger, replay entry point, or oracle. Add an Item mapping each TLA+ invariant to a runtime property check; add an Item specifying trace NDJSON schema, capture, replay, oracle.
- [bdd] Item 22 test doubles cover only claude and git. Missing: TLC handler double, tests handler double, SQLite migration fixture, worktree fixture, token-usage injector for checkpoint testing (Item 12 references result.usage.total_tokens threshold with no injection path).
- [bdd] Test isolation primitives unspecified: per-test mutex naming prefix (Item 15 uses OS-named mutexes that collide across parallel test runs), evt_id allocator reset between tests, runspace cleanup, assertion of no leaked test-double processes at teardown.
- [bdd] Bus test seam undefined. Items 24 and 7 describe Stage 2-7 behavior but no scenario states whether stage-level unit tests mock Send-BusEvent/Wait-BusGroup or run a real bus instance. Without this contract every stage test will reinvent its seam.
- [bdd] Several Then-clauses are unobservable: Item 11 line 562 'the agent updates its working belief', Item 6 line 330 'the agent self-corrects on its next turn', Item 13 line 653 'the human observes the banner and decides whether to Ctrl+C'. Rewrite as measurable side-effects (payload digests, exit codes, status changes).
- [bdd] Missing edge cases: Wait-BusGroup with empty group / singleton group / group member crashing mid-fan-out (Item 7); Ctrl+C during Start-BusAgent mid-spawn causing PID leak (Item 3); evt_id wraparound at integer-type boundary (Item 4); checkpoint racing with pending done in same turn and checkpoint while commit mutex held (Item 12); ConcurrentQueue backpressure when orchestrator stalls (Item 18).
- [bdd] -Resume edge cases missing (Item 10): SQLite locked by another vibe.ps1 instance; malformed/schema-invalid checkpoint_json at resume; partial commit (commit succeeded but event_log row failed, and the inverse); worktree path no longer exists on disk; agent_sessions shows status='alive' but OS has no such PID.
- [bdd] Performance / non-functional scenarios absent. No stated events/sec budget or event latency p50/p99, ground_truth byte-size bound (Item 11, O(n^2) growth), checkpoint_json size bound (Item 12), event_log index requirement (Item 13 heartbeat full-scans), process-count cap for Stage 7 fan-out, or measured renewal cost vs avoided Invoke-Claude cold-start cost (the entire performance motivation).
- [bdd] Migration cutover unspecified (Item 20). Since feature flags are forbidden and this is an end-to-end rewrite, the cutover is necessarily a single atomic PR — add scenario asserting no intermediate commit on master leaves Stage 2-7 in a hybrid Invoke-Claude/bus state.
- [bdd] Commit idempotency enforcement unspecified. Item 10 line 528-530 says 'the router does not re-deliver evt-001 through evt-015' but no scenario specifies HOW — git log --grep 'Vibe-Event-Id: ...' check? SQLite status='committed' marker? Without this, resume correctness is asserted but unverified.
- [bdd] Branch hygiene unspecified (Item 15 / Item 24). One commit per done event produces dozens to hundreds of micro-commits. Line 1056 says 'the bus subsystem is transparent to the downstream PR workflow' but PR workflow consumes a branch, not events. Specify squash policy, trailer preservation, or explicit PR-workflow interaction.
- [bdd] Pre-merge gate handoff to Stage 7 merge queue (line 731-735) is named only as 'outside bus scope' — the contract is undefined. Specify signal type (event_log status? sentinel event type? stage_progress?).
- [bdd] Heartbeat operational failure modes unspecified (Item 13): pipeline-log.ps1 file unwritable (disk full, permissions); terminal stdout closed/redirected; log retention/rotation; slow Write-PipelineLog mutex causing heartbeat tick miss.
- [bdd] -Status lacks bus health metrics (Item 19). Prints agent state but not queue depth in per-agent ConcurrentQueue, mutex hold duration on Write-PipelineLog and per-worktree commit mutex, or event_log write latency p50/p99. Operator cannot distinguish 'agent stuck' from 'router backpressure'.
- [bdd] Hybrid consensus override (Item 14) has no acceptance criterion bounding what can be overridden. Could a moderator override every objection trivially, defeating the hybrid check? Specify: explicit evt_id enumeration, override reason logged, ratchet preventing re-overriding the same objection across rounds.
- [bdd] Ubiquitous-language drift. Add 'deliveries' to glossary (TLA+ uses it) OR rename TLA+ variable back to eventLog. Name missing aggregates: AgentLifecycle (cross-checkpoint identity), Group, HandlerAdapter (ACL for tlc/tests/git). Either separate domain events (done, consensus_ratified) from protocol/infrastructure events (checkpoint, protocol_error) or document the deliberate single-enum choice. Enumerate bounded contexts (Bus / Elicitor / Merge-Queue / Warden / Model-Routing) as siblings with explicit integration points.
- [bdd] Append-only event_log enforcement mechanism unstated (Item 8 line 394). Specify SQLite trigger raising on UPDATE/DELETE against event_log; tests assert the trigger exists and fires.

## Round 2

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-bdd, expert-tla, expert-edge-cases, expert-tdd, expert-ddd, expert-continuous-delivery, expert-performance

### Objections
- [bdd] Item 21 'references design rationale that appeared only in the agent's earlier in-context assistant events' is unobservable — assert bytestring match or session-id distinctness instead
- [bdd] Item 20 atomic cutover is observed via git log post-hoc; add a pre-merge CI check that rejects mixed-usage commits before they land on main
- [bdd] Item 25 names GroundTruthPrecedesAgentMessage as a runtime property but the TLA+ spec does not define this invariant — add to spec or remove from Item 25
- [bdd] Item 10 -Resume must reconcile a stale pipeline_lock row whose holder PID no longer exists on the OS (mirror the alive-but-dead-PID pattern already handled for agent_sessions)
- [bdd] Item 25 property tests specify 'random sequence of up to 500 events' but omit seed and shrinking strategy — failing property tests must be reproducible
- [bdd] Item 27 renewal-vs-cold-start scenario logs token savings but has no regression threshold; add 'at least X% savings or the test fails'
- [bdd] Item 27 '50 evt/s under sustained load' does not specify sustain duration (60s? 1h?)
- [bdd] Item 12 boundary missing: agent crashes after emitting checkpoint_response but before Stop-BusAgent completes the teardown
- [bdd] Item 13 heartbeat boundary missing: system clock going backward (NTP correction) between ticks could make idle-time go negative
- [bdd] Item 27 process ceiling: checkpoint-driven respawn may transiently overshoot ceiling+1 (old process not yet ended)
- [bdd] Item 18 backpressure defines no operational alarm threshold for queue depth — silently stalled orchestrator could run indefinitely
- [bdd] Item 20 rollback direction silent — declare reverse migration out of scope or add a scenario for it
- [bdd] Item 4 Envelope invariants stated as router behavior should be Envelope value-object invariants (DDD alignment — construction rejects a duplicate evt_id)
- [bdd] Item 26 trace-replay oracle asserts equality of evt_id/type/from/to but does not specify whether payload bytes or timing deltas must match
- [bdd] Item 27 performance tests do not specify environment determinism (CI vs local, warm-up laps, noisy-neighbor exclusion)
- [bdd] Pipeline log (pipeline-log.ps1) retention and rotation unspecified — long runs grow the log indefinitely
- [bdd] Item 22 covers all required test doubles but does not address mutation-testing coverage of router code
- [bdd] Item 11 ground_truth size is bounded (8 KB) but composition-latency budget is unspecified — size is a proxy for composition cost, not cost itself
- [tla] Restore the Group aggregate — BDD Item 7 has six scenarios exercising group fan-out but the spec has no groupMembers/groupReplies state and RouterHaltsGroupViolation fires from any state with no enabling condition
- [tla] Preserve from/inReplyTo/groupId in deliveries — the v4 simplification stripped fields the BDD Item 6 role-authorization, Item 7 group, Item 14 objection-response, and Item 28 trailer-chain invariants need
- [tla] Model hybrid-consensus override (BDD Item 14) — RouterRatifiesConsensus currently requires unresolvedObjections = {} unconditionally; add overriddenObjections and NoDoubleOverride safety
- [tla] Model -Resume / crash recovery (BDD Item 10, 10 scenarios) — add RouterResumesAgent(a) action and a commit-idempotency safety property
- [tla] Model protocol-error self-correction (BDD Item 6) — RouterEmitsProtocolError only appends; add pendingProtocolError flag, corrective action, and ProtocolErrorEventuallyResolved liveness; current ProtocolErrorIsNonTerminal is a tautology
- [tla] Model GroundTruthPrecedesAgentMessage as a safety invariant (BDD Item 25 names this as a runtime property)
- [tla] Fix tautological CommitMutexHolds — already enforced by TypeOK; replace with holder-identity uniqueness
- [tla] Fix tautological ProtocolErrorIsNonTerminal — restates OnlyDefinedHalts; delete or strengthen
- [tla] Add HandlerFails(h) action — BDD Item 17 specifies three mechanical halts (missing TLC binary, scriptblock throws, unregistered target) unreachable in current spec
- [tla] Add fairness WF_vars(RouterAssignsWorktree) and WF_vars(AgentSendsDone) — without them an alive agent may never get a worktree and CommitLockEventuallyReleased is vacuous
- [tla] Distinguish 'renewing' from 'dead' — AgentCheckpointResponse conflates voluntary teardown with crash
- [tla] Split RouterCommitComplete into success/failure — BDD Item 15 requires commit-failure→mechanical_error transition that the current unconditional mutex release omits
- [tla] Differentiate mechanical-error halt reasons — BDD Item 9 distinguishes 8+ triggers; spec collapses them to one
- [tla] Rename deliveries to eventLog — BDD glossary now lists both names; v4 justification was the data structure change, not the rename
- [tla] Remove RouterAssignsWorktree or model as spawn-time attribute — no BDD counterpart; BDD treats worktree as a bootstrap payload field
- [tla] Tighten always-enabled halt actions (RouterHaltsFeatureComplete, RouterHaltsGroupViolation) or annotate as always-enabled by design
- [tla] Model handler ACL boundary — BDD Item 17 names HandlerAdapter anti-corruption layer; distinguish Router↔Handler invocation from Agent↔Router envelope
- [tla] AgentCheckpointResponse and AgentCrashes have ambiguous primed/unprimed handling of deadAtEvt at the moment of death
- [tla] No model of concurrent-feature semantics — two vibe.ps1 instances contending for SQLite pipeline_lock unverified
- [tla] No commit-idempotency safety property corresponding to BDD Items 15 and 28 ('resume does not re-commit events with status=committed')
- [tla] No bounded-liveness for commit mutex — BDD Items 15 and 27 imply mutex released within N seconds, spec only asserts 'eventually'
- [tla] DeliverGroundTruth has no precondition relating it to 'before each agent user message' (BDD Item 11)
- [tla] No model of stdin-write failure separate from agent crash (partial dispatch: event appended to event_log but write to process stdin failed)
- [tla] RouterRespawnsAgent does not enforce the bootstrap→ground_truth→checkpoint_response prelude that BDD Items 10 and 12 specify
- [tla] Every BDD Item 25 property-test invariant must have a corresponding TLA+ invariant; four of eight current safety invariants (OnlyDefinedHalts, CommitMutexHolds, EvtIdMonotone, ProtocolErrorIsNonTerminal) appear only partially in Item 25
- [tla] No model of stdout-reader → ConcurrentQueue → orchestrator pipeline backpressure (BDD Item 18)
- [tla] AppendEvent field stripping prevents upper-bound invariant on outstanding in_reply_to chains (memory-leak proxy for long-running pipelines)
- [tla] Set-based deliveries discards all temporal information; no throughput or latency properties expressible even as proxies
- [tla] Spec v4 has not changed since the prior session — all prior TLA+ objections persist verbatim
- [tla] BDD Item 14 override introduces a rule the spec cannot verify; the spec must add overriddenObjections state, not just have BDD document the behavior
- [tla] Bounded context integration points (e.g., Bus→Merge-Queue via event_log.status='committed') should be named as Published Language artifacts in both documents
- [tla] No formal invariant for Item 28 branch hygiene (uniqueness of Vibe-Event-Id in git history)
- [tla] Item 25 property scenarios imply a formal-runtime parity that the v4 spec does not deliver — either extend the spec or downgrade the Item 25 claim
- [tla] Handler dispatch (AgentSendsVerify, HandlerReturnsVerifyResult) treats handlers as indistinguishable peers — anti-corruption layer invisible in the formal model
- [tla] Missing safety property on stale pipeline_lock reconciliation (BDD Item 10 stale-lock scenario, if added, has no formal analog)

## Round 3

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-bdd, expert-tla, expert-edge-cases, expert-tdd, expert-ddd, expert-continuous-delivery, expert-performance

### Objections
- [bdd] Item 10 line 673 reclassifies agent_sessions.status to "crashed" but the glossary (line 19) enumerates only {alive, ended}; extend the enum or rename
- [bdd] Item 15 line 1008 asserts overlap-detection halt but does not specify the mechanism (pre-commit git diff --cached? path-reservation registry? post-commit check?) — Then clause is not verifiable
- [bdd] Item 20 line 1246 reverse-migration "out of scope" declaration is not CI-observable; make it enforced by a repo-level check or soften to a non-normative note
- [bdd] Item 27 line 1637 compound regression OR-clause (throughput OR latency OR token savings) violates one-outcome-per-Then discipline; split into three scenarios or explicit And bullets
- [bdd] Item 22 mutation-testing 80% kill-rate has no enumerated operator catalog; pin mutation operators (boundary off-by-one, guard negation, constant replacement, routing-rule inversion) in tests/bus/mutation-operators.md
- [bdd] Item 22/25/26 scenarios are nearly all @integration; add a fast @unit tier for envelope construction (Item 4b), routing-rule lookup (Item 6), schema validation (Item 5), evt_id allocator in isolation
- [bdd] Item 25 covers only 5 of 8 TLA+ safety invariants; add property scenarios for OnlyDefinedHalts, CommitMutexHolds, ProtocolErrorIsNonTerminal
- [bdd] Item 26 trace-replay oracle rejects whitespace drift on JSON payloads; canonicalize JSON (sorted keys, no whitespace) before byte-equality or justify preserving whitespace
- [bdd] Item 27 CI environment is unpinned; commit runner specs (CPU class, RAM, disk type) to performance-baselines.json for reproducibility
- [bdd] No suite-level assertion that @unit tests stay under 50ms (architectural duration budget)
- [bdd] Three-way partial commit unhandled: git commit succeeded + event_log.status="committed" + commitLock not released + crash — on -Resume, mutex recovery path undefined
- [bdd] Checkpoint-during-consensus-vote unhandled: agent emitted consensus_candidate then crosses 80% context — is consensusState=candidate a checkpoint-exclusion zone?
- [bdd] Checkpoint-during-objection: after respawn, no scenario asserts the moderator still sees its own unresolved objection from the new session_id perspective
- [bdd] Stdin Flush() IOException unhandled: event status=routed but pipe closed before bytes drained — on-crash reconciliation undefined
- [bdd] Concurrent evt_id allocator race unspecified: two runspaces racing to append, no scenario names the synchronization primitive (SQLite AUTOINCREMENT? Interlocked? mutex?)
- [bdd] NTP forward clock jump unhandled (Item 13 covers backward only): all idle-time calculations flip, possible alert storm
- [bdd] DST transition during long pipeline run: timestamps stored as local time would double-count or skip an hour; fix all timestamps as UTC
- [bdd] checkpoint_json 128 KB truncation: a truncated JSON may deserialize but omit critical unresolvedObjections state — no invariant asserts truncation preserves state needed by -Resume
- [bdd] SQLite WAL file growth uncapped over long pipeline runs; add a PRAGMA wal_checkpoint cadence or size bound
- [bdd] File descriptor exhaustion untested: 16 agents × 3 pipes + SQLite + log + git handles could reach EMFILE
- [bdd] Respawn-during-ceiling: old PID not yet reaped + new PID spawned can transiently push count to ceiling+1 — serialize teardown-then-spawn or scenario the transient
- [bdd] Duplicate override replay after -Resume: Item 14 forbids double-override across rounds, but a crash between override and consensus_ratified is ambiguous
- [bdd] Item 10 orphan-but-live lock holder (zombie, stuck, paused) has no remediation path; stale-PID reconciliation covers only dead holders
- [bdd] Item 15 git-commit-failure halt does not specify whether the partially-applied git index is rolled back; next -Resume inherits a dirty index
- [bdd] Item 19 bus health metrics printed only on -Status demand; not emitted to operational alarm sinks (queue-depth sustained-above-threshold, heartbeat-delta >10s)
- [bdd] Item 27 performance-baselines.json update has no provenance check; a PR can silently edit the baseline to bypass regression enforcement
- [bdd] Item 28 Vibe-Event-Id uniqueness tested per-feature; no assertion on global uniqueness across the repository history
- [bdd] Item 27 30-second sustained load is a smoke test, not a soak; add a 60-minute run with per-agent RSS and WAL-size bounds
- [bdd] Per-agent process RSS/working-set envelope never measured for 16 concurrent claude processes
- [bdd] Item 13 heartbeat records actual-vs-scheduled delta but has no alarm threshold; repeated delta >10s means stalled pipeline
- [bdd] Item 11 ground-truth 50ms budget is per-message; aggregate budget at 50 evt/s × 16 agents unstated
- [bdd] No upper bound on in-reply-to chain depth (correlation-table memory-leak proxy)
- [bdd] Integration contracts between bounded contexts are enumerated but not named as artifacts (Bus→Merge-Queue via event_log.status='committed' is a Published Language needing its own contract section)
- [bdd] Item 4b Envelope invariants do not cover in_reply_to semantic validity (must reference a real prior evt_id); still delegated to router behavior in Item 4
- [bdd] AgentLifecycle glossed as aggregate identity but no scenario asserts the identity persists across a checkpoint handoff (distinct from session_id which does not)
- [tla] Spec is byte-identical to the v4 reviewed in the prior session (679 lines, v4 header intact, same 15 actions, same 8 safety invariants, same 3 liveness properties, same 5 fairness clauses); zero of 16 prior objections absorbed
- [tla] AppendEvent (line 190) stores only {evt_id, to, type}; from, inReplyTo, groupId discarded — routing-rule (Item 6), hybrid override (Item 14), group (Item 7), and Vibe-Event-Id trailer (Item 28) invariants unverifiable
- [tla] No Group state (groupMembers, groupReplies, WaitGroupResolves) — RouterHaltsGroupViolation (line 512) fires unguarded; BDD Item 7 six scenarios have zero formal backing
- [tla] RouterRatifiesConsensus (line 398) requires unresolvedObjections={} unconditionally; BDD Item 14 hybrid override allows ratification with enumerated override evt_ids — add overriddenObjections and weaken the guard
- [tla] No RouterResumesAgent(a) action — BDD Item 10 (11 scenarios) has zero formal coverage; -Resume is the single largest CD safety surface
- [tla] No commit-idempotency invariant for resume trajectories — BDD Item 15 and Item 28 assert "resume does not re-commit events with status=committed" with no spec analog
- [tla] No HandlerFails(h) action — BDD Item 17 lines 1001-1015 specify three mechanical halts (missing TLC binary, scriptblock throws, unregistered target) unreachable in TLC
- [tla] CommitMutexHolds (line 626: \A w: commitLock[w] \in BOOLEAN) is TypeOK restated — tautological; replace with holder-identity invariant ("at most one agent holds commitLock[w]")
- [tla] ProtocolErrorIsNonTerminal (line 634) is provable from OnlyDefinedHalts — tautological; replace with pendingProtocolError liveness formulation
- [tla] RouterEmitsProtocolError (line 340) appends an event but no action consumes it; protocol-error self-correction (BDD Item 6 line 413) is unmodeled
- [tla] Fairness missing WF_vars(RouterAssignsWorktree) and WF_vars(AgentSendsDone) — CommitLockEventuallyReleased is vacuous on traces that never acquire a lock
- [tla] AgentCheckpointResponse (line 310) transitions checkpointing→dead, conflating voluntary renewal with crash; introduce a "renewing" status distinct from "dead"
- [tla] All mechanical halts collapse to "mechanical_error"; BDD Item 9 distinguishes 8+ triggers — add failureCategory ∈ {duplicate_evt_id, group_violation, git_commit, handler_failure, sqlite_error, agent_crash, ...}
- [tla] RouterCommitComplete (line 271) releases mutex unconditionally; BDD Item 15 line 1000 requires split into RouterCommitSucceeds (releases mutex) and RouterCommitFails(w) (mechanical_error)
- [tla] RouterAssignsWorktree (line 245) has no BDD counterpart; BDD treats worktree as a bootstrap-time attribute — remove from spec and fold into bootstrap event
- [tla] RouterHaltsFeatureComplete (line 483), RouterHaltsGroupViolation (line 512), UserInterrupts (line 521) have no semantic preconditions — always-enabled on a running bus; add real preconditions or annotate explicitly
- [tla] No GroundTruthPrecedesAgentMessage invariant; BDD Item 25 line 1524 explicitly acknowledges the gap — either add it or drop the Item 25 citation
- [tla] DeliverGroundTruth has no guard relating it to "before each non-bootstrap agent-bound event" — ground-truth precedence unmodeled
- [tla] No HandlerAdapter anti-corruption boundary in the state model; AgentSendsVerify / HandlerReturnsVerifyResult treat handlers as indistinguishable peers
- [tla] Naming drift: deliveries vs BDD's event_log — v4 justification was structural (Set vs Seq), not lexical; rename deliveries→eventLog for glossary parity
- [tla] No commitLockHolder field; "at most one agent holds it" unprovable structurally
- [tla] RouterCommitComplete and AgentCrashes interleave between AppendEvent(done) and commitLock'=TRUE; spec pairs them atomically while the implementation does not — crash exactly as the mutex acquisition completes is unmodeled
- [tla] No binding between consensus_candidate emission and the emitting agent's session_id; RouterRespawnsAgent cannot invalidate an in-flight candidate, so CandidateEventuallyResolves can be true for the wrong reason
- [tla] AgentCrashes primed deadAtEvt'=nextEvtId races with AgentCheckpointResponse's same prime in the same step; TLC non-determinism allows either; need a checkpointResponseInFlight flag
- [tla] No nextEvtId overflow action — BDD Item 4 requires a halt near Int64.MaxValue-1; spec silently assumes MaxEvtId is never approached
- [tla] No AgentReceiveFails(a) action modeling stdin-write failure separate from agent crash (event appended with status=routed but agent never saw it)
- [tla] No clock or timestamp state variables; NTP/DST/heartbeat-delta scenarios from BDD are unmodelable
- [tla] No fdCount or resource-exhaustion state; 16-agent ceiling is a constant in the cfg but not a constraint in the spec
- [tla] Single-feature run modeled; no concurrent-feature semantics — two vibe.ps1 invocations against one SQLite unmodeled
- [tla] pipeline_lock is not a TLA+ variable; stale-lock reclaim (BDD line 678) has no formal analog; "lock is eventually reclaimable" liveness unstatable
- [tla] No bounded liveness — CommitLockEventuallyReleased is unbounded ~>; BDD Item 15 / Item 27 imply timed release; either annotate bounded timing out of scope or add a step-counting bound
- [tla] No fairness around commit-lock contention between competing AgentSendsDone on the same worktree; starvation allowed by the current spec
- [tla] AppendEvent field stripping prevents outstanding-reply-chain invariants (bound the cardinality of outstanding inReplyTo values as a memory-leak proxy)
- [tla] Four of eight TLA+ safety invariants have no property-test analog in BDD Item 25 because the spec under-specifies; OnlyDefinedHalts, CommitMutexHolds (tautology), ProtocolErrorIsNonTerminal (tautology), EvtIdMonotone only partially covered
- [tla] No overriddenObjections set — Item 14 hybrid override and NoDoubleOverride safety cannot be expressed
- [tla] No ceiling variable — BDD Item 27 line 1645 "strictly bounded by ceiling, not ceiling+1" unverifiable in TLC
- [tla] No Envelope value-object predicate (constructor validation); BDD Item 4b invariants have no formal mirror

## Round 4

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-bdd, expert-ddd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-performance

### Objections
- [tla] AgentEmitsAfterProtocolError emits type='objection_response' which is semantically wrong after protocol error; use a dedicated 'protocol_error_ack' type or remove the action (agent is dead).
- [tla] UserInterrupts leaves failureCategory stale from prior halts; set it to 'user_interrupt' or clear it.
- [tla] RouterHaltsFeatureComplete precondition is vacuous — admits completion without any moderator_final_ratify event. Require an existential over ratifiedEvents.
- [tla] Commit-lock release uses WF; upgrade to SF on RouterCommitSucceeds to rule out starvation under adversarial scheduling.
- [tla] No pipeline_lock variable or actions — concurrent vibe.ps1 invocations (referenced in BDD Items 24/31) are unformalized.
- [tla] AppendEvent does not enforce inReplyTo ∈ routedIds[sender]; dead-agent prevention is only post-hoc.
- [tla] HandlerAdapterDispatch is atomic; split into Receives + Completes to model the handler-busy window.
- [tla] pendingProtocolError[a] not cleared on RouterRespawnsAgent / RouterResumesAgent — ProtocolErrorEventuallyResolved can be falsely satisfied.
- [tla] Aggregate boundary between Bus and HandlerAdapter not surfaced in spec; DDD would treat HandlerAdapter as an ACL translator.
- [tla] Liveness is unbounded; BDD Item 27 has numeric latency bounds. Introduce Tick action or reconcile by relaxing BDD to 'eventually'.
- [tla] No action models the bus cutover itself — spec assumes bus always present.
- [tla] Checkpoint timer race not specified: agent checkpointing AND reaching 100% context — which wins?
- [tla] SQLite BEGIN IMMEDIATE failure mode (WAL contention) not modeled.
- [tla] Stream-json partial message (half-written line on crash) not modeled.
- [tla] TLA+ counterexamples should be replayable as BDD scenarios; no mechanism described.
- [tla] No fairness distinction between hot-path and recovery-path actions — permits pathological slowness in steady state.
- [bdd] Glossary line 27 still says 'Deliveries' — rename to 'eventLog' to track TLA+ v5 variable rename.
- [bdd] Item 25 property-test scenarios cite v4 invariant names (OnlyDefinedHalts, ProtocolErrorIsNonTerminal, GroundTruthPrecedesAgentMessage, CommitMutexHolds) that have been renamed or retired in v5r5.
- [bdd] Item 25 missing property-test scenarios for the four new v5 invariants: OverrideIntegrity, CommitIdempotency, NoNonMemberGroupReply, CommitLockHolderAliveOrBusHalted.
- [bdd] Item 4c @unit budget arithmetic inconsistent: 50 ms per test × 8 tests cannot fit a 50 ms suite total — pick one (400 ms suite total is the internally consistent choice).
- [bdd] Item 4c evt_id allocator contradicts itself: 'no SQLite in @unit' vs 'allocator uses SQLite AUTOINCREMENT' — mock the allocator or drop the AUTOINCREMENT reference.
- [bdd] performance-baselines.json referenced by Item 27 but not committed in-tree; CI will fail.
- [bdd] Item 28 (branch hygiene) missing end-to-end scenario for /rollback command path.
- [bdd] Item 29 (merge-queue handoff) needs distinct CI exit codes per FailureCategory so CI can dispatch without parsing stderr.
- [bdd] Item 31 Published Language contract should explicitly version the envelope schema (semver); currently implicit.
- [bdd] Item 24 (migration/cutover) missing feature-flag scenario — without a flag, cutover is a big-bang deployment.
- [bdd] No canary / dark-launch scenario; BDD should explicitly document the 'no shadow mode' promise from elicitor.md.
- [bdd] No mutation-testing scenario despite mutation testing being in scope (per elicitor.md).
- [bdd] Test-double registry (Item 23) lacks a scenario asserting 'test double matches production contract' — contract drift hazard.
- [bdd] Item 11 (heartbeat) missing scenario for 'heartbeat arrives during checkpoint' — ordering ambiguity.
- [bdd] Item 28 (branch hygiene) missing scenario for 'stale branch from crashed run detected on resume'.
- [bdd] Item 11 heartbeat cadence not tied to checkpoint threshold — could produce monitoring dead zone at 80% context.

## Round 5

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-bdd, expert-ddd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-performance

### Objections
- [bdd] Glossary claims '15 closed-enum values' but TLA+ v6 EventTypes has 16 after OBJ-1 added protocol_error_ack — cross-document drift
- [bdd] Item 5 Scenario Outline Examples table does not include a row for protocol_error_ack
- [bdd] Item 25 traceability still cites v5r5 name RatificationRequiresNoObjections; v6 renamed to RatificationRequiresNoUnoverriddenObjections
- [bdd] Item 25 claims OnlyDefinedHalts and GroundTruthPrecedesAgentMessage are 'unnamed in spec' but v6 names them at lines 1186 and 1209
- [bdd] Item 4c arithmetic wrong: claims 8 @unit scenarios × 50ms = 400ms but only 7 @unit scenarios exist (lines 342, 351, 359, 367, 374, 381, 389)
- [bdd] Item 30 describes engineering practice (review cadence, dashboards) rather than acceptance criteria — belongs in an ADR
- [bdd] Item 31 Published Language contract scenario has multiple When steps (Gherkin anti-pattern)
- [bdd] Envelope invariants split between construction-time (Item 4b payload shape) and router-time (Item 6 in_reply_to validation) — should be consolidated
- [bdd] Item 17 HandlerAdapter scenario doesn't reflect the two-phase Receives/Completes split introduced in OBJ-7
- [bdd] Item 29 collapses 8 FailureCategory domain values into 3 exit codes with no explicit mapping table
- [bdd] Missing property-based test scenario for BusRunningImpliesLockHeld (OBJ-5) — only presence-checks exist
- [bdd] Missing scenario asserting the TLA+ gate never shells out to a real tlc binary (per project mock_claude_and_git_in_tests rule)
- [bdd] No mutation-testing threshold scenario for bus/router.ps1 key predicates
- [bdd] Item 8 declares event log append-only; Items 15 and 18 describe status updates on existing rows — contradiction
- [bdd] Item 10 -Resume reuses PID from agent session row without fingerprint verification (PID-reuse vulnerability)
- [bdd] Item 13 'silently swallow heartbeat failures' violates project no-silent-failures rule and hides degradation
- [bdd] Missing scenario for stdout-reader runspace crash and recovery
- [bdd] No envelope payload size cap — runaway agent can emit multi-GB envelope
- [bdd] Type field accepts any UTF-8 — no Unicode normalization, no binary-payload rejection
- [bdd] in_reply_to can form cycles; no cycle-detection scenario
- [bdd] ModeratorOverridesObjection BDD scenario has no role guard — any agent can claim moderator role
- [bdd] Item 28 /rollback queries snapshot entries but no scenario defines snapshot producer (trigger, schema, retention)
- [bdd] Atomic-cutover no-invoke-claude-regression detection mechanism unspecified (regex, AST, analyzer?) — non-executable scenario
- [bdd] Performance-baselines bootstrap circular dependency: Item 4c/30 compare against tests/bus/performance-baselines.json but no scenario creates it
- [bdd] Item 28 git log --all is an unbounded scan over repository history — bound by date, count, or branch
- [bdd] No CI job inventory — which jobs run which scenarios, ordering, parallelism, shared fixtures
- [bdd] No deploy-time observability scenario (alerts, dashboards, rollback triggers)
- [bdd] Item 31 CODEOWNERS for bus/ subsystem not specified
- [bdd] tests/bus/performance-baselines.json still not present on disk (same as pre-v6 objection; not fixed)
- [bdd] Latency bound 50ms scope ambiguous — does it include dispatch, handler, and commit, or only one phase?
- [bdd] Ground-truth aggregate '50ms across 16 agents' incoherent with per-message 50ms budget
- [bdd] Soak test scenario missing throughput/latency drift assertions — a soak without regression detection is decorative
- [tla] ModeratorOverridesObjection is structurally unreachable: ModeratorEmitsCandidate requires unresolvedObjections = {} but override requires unresolvedObjections /= {}
- [tla] RouterHaltsSqliteError (OBJ-13) unguarded — can fire from any state, producing spurious traces disconnected from SQLite interaction
- [tla] context_limit FailureCategory is orphaned — no action ever sets failureCategory = 'context_limit'
- [tla] HandlerAdapterCompletes allows inReplyTo to reference any routed id, not strictly the matching HandlerAdapterReceives for the same (agent, handler) pair
- [tla] AgentSendsDone uses WF while sister action RouterCommitSucceeds was upgraded to SF in OBJ-4 — unexplained asymmetry
- [tla] SpawningAgentOnlyReceivesBootstrap should assert exactly one bootstrap, not merely that bootstrap is the only type received
- [tla] DomainEventType vs ProtocolEventType split is conceptual only — no invariant prevents protocol events from entering ratified consensus
- [tla] NoNonMemberGroupReply is tautological — SendToGroup already enforces membership at guard level, invariant unverifiable by construction
- [tla] Exit-code mapping from FailureCategory is implicit in prose — should be a reified ExitCodeOf(cat) operator with totality invariant
- [tla] Liveness property ProtocolErrorEventuallyResolved lacks paired safety invariant that the state can only be left via AgentEmitsAfterProtocolError
- [tla] No tick/clock variable despite BDD referencing NTP skew and DST transitions — either add clock with monotonicity invariant or scope out explicitly
- [tla] RouterHaltsBoundReached comment labels it HOT PATH but semantically it's a terminal mechanical-error path — mis-label

## Round 6

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-bdd, expert-ddd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-performance

### Objections
- [bdd] Glossary line 29 still reads '15 closed-enum values'; TLA+ v7 defines 16 including protocol_error_ack
- [bdd] Item 5 Examples table (lines 420-436) missing protocol_error_ack row
- [bdd] Zero scenarios describe the protocol_error_ack roundtrip; TLA+ action AgentEmitsAfterProtocolError is behaviorally uncovered
- [bdd] Item 4c arithmetic wrong: claims 8 @unit × 50ms = 400ms but only 7 @unit scenarios exist at lines 342, 351, 359, 367, 374, 381, 389
- [bdd] Item 25 property tests missing for 7 v7 invariants (ExactlyOneBootstrapPerLifetime, ConsensusEventsRoutedThroughBus, RatificationViaConsensusProtocol, AllGroupRepliesHaveSentEvents, BusRunningImpliesLockHeld, ExitCodeTotality, PendingProtocolErrorImpliesAgentAlive) plus TypeOK and 4 liveness properties
- [bdd] Item 25 traceability cites 'v5r5' at 8 locations (1771, 1786, 1798, 1803, 1804, 1825, 1836, 1846); spec is v7 with renamed invariants
- [bdd] Item 28 /rollback (2091-2101) references snap-003 with no scenario defining the snapshot producer (trigger, schema, retention)
- [bdd] no-invoke-claude-regression CI gate (1458, 1714) has no named detection algorithm (AST walker? regex? exclude paths?)
- [bdd] tests/bus/performance-baselines.json absent on disk; tests/bus/ directory also absent; no scenario seeds the file, creating a circular bootstrap dependency
- [bdd] Heartbeat 'silently skips' write failures (lines 1022-1035) violates no-silent-failures rule; needs counter increment + edge-triggered log
- [bdd] Append-only event log (28/605) contradicts status updates (243/602/912); resolve via separate table or whitelisted transitions
- [bdd] Item 10 -Resume PID reuse (lines 792, 802) has no fingerprint check against kernel PID recycling
- [bdd] Exit-code table non-total: Item 29 collapses 6 sub-categories into exit code 2, while TLA+ ExitCodeOf maps 7 FailureCategories to 7 distinct codes (10-16) — direct contradiction of BDD's own 'no two share a code' claim
- [bdd] Three-way event-type split (ConsensusEventTypes / ProtocolBookkeepingEventTypes / DomainEventTypes) in TLA+ v7 not reflected in BDD glossary which defines only two-way DomainEventType/ProtocolEventType
- [bdd] Item 17 HandlerAdapter still reads as single-shot dispatch; TLA+ v7 names HandlerAdapterReceives + HandlerAdapterCompletes distinctly
- [bdd] No envelope payload size cap; no Unicode-normalization/binary-rejection on type field; no in_reply_to cycle detection; no moderator role guard on override; no from='router' check on consensus_ratified
- [bdd] No scenario asserts the TLA+ gate never shells to a real tlc binary (parallel to claude/git mocking rule)
- [bdd] Item 31 line 2246 scenario has two When steps (multi-When Gherkin anti-pattern); line 2250 trailing And is documentation commentary not observable Then
- [bdd] Item 30 is aspirational engineering-practice text, not testable Given/When/Then; mutation kill rate 80% too low; mutation-operators.md catalog not pinned by hash
- [bdd] No CI job matrix mapping 162 tagged scenarios to jobs/parallelism/shared fixtures
- [bdd] Zero deployment observability scenarios (alerts, dashboards, smoke tests, rollout metrics) despite no-canary/no-shadow design making post-deploy the sole safety net
- [bdd] Branch hygiene (Item 28) omits force-push prevention, branch-protection ruleset, required-check list, linear-history enforcement; CODEOWNERS never defined
- [bdd] Item 28 'git log --all' is unbounded O(repo-history) scan on every PR
- [bdd] Performance budget taxonomy unlabeled: per-message vs aggregate vs e2e scopes inconsistent; ground-truth '50ms across 16 agents' yields 3.1ms/agent — physically implausible with SQLite
- [bdd] Soak test (Item 1994) missing p50/p95/p99 latency drift, throughput drift, GC/allocator growth, event_log row-count assertions; would pass a router that stops mid-run
- [bdd] p95 never named; only p50/p99 appear; hides tail-latency regressions in the 20% p99 band
- [bdd] Heartbeat CPU/IO cost unbounded (~72 CPU-sec/hr on 10000-row index query alone — unasserted)
- [bdd] evt_id allocator throughput ceiling unspecified; fan-out scaling scenarios absent; checkpoint cycle wall-clock cost no budget
- [bdd] No runtime property test for WF/SF fairness asymmetry (AgentSendsDone WF vs RouterCommitSucceeds SF)
- [bdd] No stdout-reader runspace crash recovery scenario (runspace faulted while process alive)
- [tla] OBJ-1 fix incomplete: ModeratorEmitsCandidate (line 780) lacks consensus-safety guard; combined with RouterRatifiesConsensus admits zero-debate ratification path bypassing intended protocol
- [tla] OBJ-2 guard on RouterHaltsSqliteError (line 1157) still too loose — any alive agent anywhere enables it regardless of SQLite involvement; anchor to a concrete SQLite-mutating transition
- [tla] HandlerAdapterCompletes(h) liveness gap: if agent dies and respawns between Receives and Completes, handlerState[h] stays 'busy' forever; no WF/SF on HandlerFails in Fairness section
- [tla] Hotfix ~pendingProtocolError[a] guard on RouterInitiatesCheckpoint creates evt_id-exhaustion deadlock: if protocol error raised near MaxEvtId bound, ack cannot append, WF cannot fire, checkpoint permanently blocked
- [tla] ExitCodeTotality (line 1423) is tautological over a constant set — belongs in proof obligation, not INVARIANT list; missing the useful totality check: busStatus='halted' ∧ haltReason='mechanical_error' ⇒ failureCategory ∈ FailureCategories
- [tla] RatificationViaConsensusProtocol (line 1414) is vacuous by construction — only RouterRatifiesConsensus sets ratified and it unconditionally appends the matching event; fine as documentation, not a meaningful TLC check
- [tla] No type-to-sender ACL on AppendEvent — any agent can fabricate type='consensus_ratified'; add TypeSenderACL invariant enforcing which sender may emit which type
- [tla] Fairness section incomplete: ReleasePipelineLock orphaned; UserInterrupts/UserResumes may need fairness for resume path
- [tla] Missing handler-state consistency invariant: handlerPendingAgent[h] ≠ NULL ⇔ handlerState[h]='busy' (and same for handlerPendingEvt)
- [tla] /rollback unmodeled — no Snapshot variable, no Rollback action; liveness/safety of /rollback unchecked
- [tla] evt_id_overflow action uses MaxEvtId=4 for model checking but production is Int64.MaxValue; mark as documentation-only or state modeled-vs-production relationship explicitly

## Round 7

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-bdd, expert-ddd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-performance

### Objections
- [bdd] Item 25 traceability block still enumerates v7 invariants; missing TypeSenderACL, HandlerStateConsistency, MechanicalHaltHasCategory, CandidateHasEventInLog, RollbackRequiresSnapshot, RollbackEventuallyCompletes — six v8 properties have zero BDD property scenarios.
- [bdd] Obsolete scenario 'ExitCodeTotality' references an invariant removed from the cfg (OBJ-5); scenario must be renamed/rewritten as 'MechanicalHaltHasCategory' to match the replacement invariant.
- [bdd] Obsolete scenario 'RatificationViaConsensusProtocol' references an invariant removed from the cfg (OBJ-6); scenario must be renamed/rewritten as 'CandidateHasEventInLog' to match the replacement invariant.
- [bdd] HaltReasons enum in glossary is missing 'user_rollback' (added by OBJ-10); all downstream halt-category scenarios are now underspecified.
- [bdd] Rollback feature has no /rollback CLI surface specified — user interaction (UserRequestsRollback action) is undefined at the BDD layer.
- [bdd] Rollback semantics diverge from TLA+: BDD implies event-log mutation on rollback while TLA+ RouterExecutesRollback leaves event-log immutable. One document must be reconciled.
- [bdd] No scenario covers the snapshot/rollback worktree-scoping requirement — snapshotExists is per-worktree in TLA+ but BDD treats it as a global.
- [bdd] Eighth @unit tag appears twice in the tag index; dedupe required before CI gate accepts feature.
- [bdd] Ground-truth budget scenario mixes bytes and KB inconsistently (8KB vs 8192 B in different Given/Then steps); arithmetic must be dimensionally consistent.
- [bdd] Heartbeat performance scenario double-counts CPU cost (heartbeat emitter AND listener both charged 0.1%); model should charge emitter-side only.
- [bdd] ConsensusEventsRoutedThroughBus has no scenario asserting the negative — i.e., that a direct handler→agent consensus event is rejected.
- [bdd] SpawningAgentOnlyReceivesBootstrap has no scenario covering the negative case where a spawning agent receives a non-bootstrap event and the bus halts.
- [bdd] BusRunningImpliesLockHeld lacks a scenario asserting the bus must halt if the commit lock is released while still running.
- [bdd] HandlerStateConsistency (new v8 invariant) has no scenario verifying handler state cleanup when agent crashes mid-handler-invocation.
- [bdd] PendingProtocolErrorImpliesAgentAlive has no scenario for the corner where agent dies while protocol error is pending.
- [bdd] RollbackEventuallyCompletes (new v8 liveness property) has no scenario with explicit progress assertion under fairness.
- [bdd] TypeSenderACL (new v8 invariant) has no scenario verifying per-type sender restrictions (e.g., handler cannot emit 'done', moderator cannot emit 'commit_request').
- [bdd] AllGroupRepliesHaveSentEvents invariant has no scenario covering stale group_id replies after the sender has died.
- [bdd] OverrideIntegrity invariant lacks a scenario covering double-override attempts (idempotency).
- [bdd] CommitIdempotency has no failure-mode scenario (e.g., partial commit followed by retry).
- [bdd] Multiple scenarios use 'And the system eventually' without a bounded step — TDD expert flagged untestability; convert to 'within N events' or tag @liveness with fairness note.
- [bdd] Checkpoint renewal scenario omits the ~80% threshold as the explicit trigger; triggers described as 'when context is full' is non-deterministic.
- [bdd] Ground-truth injection is described as 'prepended' in some scenarios and 'appended' in others — SQLite-derived block position must be normalized.
- [bdd] Performance scenarios cite targets without defining the measurement window (p50/p95/p99 vs mean); performance expert requires percentile+window per target.
- [bdd] CI-gate scenarios reference 'fail the build' without specifying which CI stage (lint/test/typecheck) — continuous-delivery expert requires stage-tagged gates.
- [bdd] DDD: 'agent' aggregate boundary is leaky — some scenarios mutate agent_sessions row fields directly rather than through a domain action.
- [bdd] DDD: 'handler adapter' bounded context has no anti-corruption layer scenario — external handler contract must be exercised at the boundary.
- [bdd] Edge-case: no scenario for SQLite file deletion mid-run (disk failure / external delete).
- [bdd] Edge-case: no scenario for MaxEvtId overflow at runtime (wrap-around or halt behavior unspecified).
- [bdd] Edge-case: no scenario for duplicate agent_id collision on respawn (RouterRespawnsAgent contract).
- [tla] RouterExecutesRollback lacks a BusRunning guard — action can fire while bus is halted, clobbering halt reason.
- [tla] UserResumes lacks a ~rollbackRequested guard — user can resume a bus that has a pending rollback request, losing the request.
- [tla] RouterTakesSnapshot lacks a ~rollbackRequested guard — snapshot can be taken after rollback is requested but before execution, invalidating the rollback target.
- [tla] RollbackRequiresSnapshot invariant does not require the snapshot to match the worktree being rolled back — cross-worktree rollback is reachable.
- [tla] TypeSenderACL is from-side only; recipient (to-side) constraints are missing — e.g., 'bootstrap' events with non-spawning recipient remain unrejected at the invariant level.
- [tla] AgentCrashes clears handler state atomically for the crashing agent, but there is no invariant asserting no orphaned handler-verify steps remain for that agent.
- [tla] On RouterExecutesRollback, consensusState is not reset — CandidateHasEventInLog may reference a pre-rollback event_log entry that is semantically invalid post-rollback.
- [tla] In-flight commits are not drained before RouterExecutesRollback — CommitLockHolderAliveOrBusHalted may be temporarily violated during rollback.
- [tla] HandlerAdapterCompletes does not check that handler is still the same instance that received the call — handler respawn/replacement mid-call is not guarded.
- [tla] ModeratorEmitsCandidate's '+groundTruthDelivered[a]' guard (OBJ-1) should also require groundTruthDelivered for every objecting agent, not just the moderator-side.
- [tla] RouterHaltsSqliteError narrowing to {spawning, checkpointing, renewing} (OBJ-2) omits 'rolling_back' — SQLite errors during rollback execution have no halt action.
- [tla] Fairness: no WF on UserRequestsRollback — rollback request can be starved indefinitely by scheduler.
- [tla] Fairness: no WF on RouterTakesSnapshot — if snapshotExists stays FALSE forever, RollbackEventuallyCompletes vacuously holds and masks a liveness bug.
- [tla] State-space budget note cites '~4x over v7' but symmetry is intentionally omitted for liveness; the combined explosion factor with Worktrees={wt1} is not quantified (performance expert).
- [tla] MechanicalHaltHasCategory invariant does not distinguish between the nine HaltReasons — a halt with category='generic' would satisfy the invariant trivially.

## Round 8

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-bdd, expert-ddd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-performance

### Objections
- [bdd] Pervasive version drift: 71 occurrences of v7/v8 citations; zero v9/v10 references. Every Item 25 traceability comment (lines 2043-2375) is one-to-three versions behind the cfg it claims to verify. Endorsed by 4 experts (tla, bdd, ddd, tdd).
- [bdd] NoOrphanedHandlerForDeadAgent (new v9 invariant, OBJ-6(v9), cfg line 132) has zero property scenarios. Required: seed-pinned @primary @integration scenario asserting agentStatus[a]='dead' => forall h: handlerPendingAgent[h] != a. Endorsed by 4 experts.
- [bdd] HandlerStateConsistency scenario (line 2338) does not cover handlerPendingEpoch (OBJ-9(v9)). Needs tri-field biconditional and stale-completion rejection scenario (HandlerAdapterCompletes rejecting when spawnedAtEvt[a] != handlerPendingEpoch[h]). Endorsed by 4 experts.
- [bdd] TypeSenderACL scenario (line 2323) covers only from-side; v9 OBJ-5 landed to-side ACL. Line 2334 actively asserts this is 'pending TLA+ extension left for v9' — stale and false. Endorsed by 4 experts.
- [bdd] RouterHaltsRollbackSqliteError (new v9 halt action, OBJ-11(v9)) has no BDD scenario. Missing: exit code 14, failureCategory='sqlite_error', rollbackRequested/rollbackTargetWorktree cleared, -Resume recovery path. Endorsed by 4 experts.
- [bdd] Self-contradiction on rollback semantics: line 2710 lists 'rolled_back' as valid status; line 3007 whitelists routed->rolled_back transition; line 2751 declares event_log NOT mutated. All three cannot simultaneously be true.
- [bdd] v10 failureCategory fix (FIX-1/2/3 clearing failureCategory on RouterHaltsFeatureComplete/RatifiesConsensus/FailsConsensus) is not driven by any targeted scenario. The exact trace v10 repaired — mechanical halt with non-NULL failureCategory -> -Resume -> semantic halt -> failureCategory=NULL — will not reliably surface under the existing random-seed scenario at line 2221. Endorsed by 3 experts.
- [bdd] Worktree-scoped rollback (rollbackTargetWorktree variable, OBJ-4(v9)) absent from BDD vocabulary. /rollback CLI scenarios (2732-2794) accept -SnapId but do not explain worktree derivation or include cross-worktree rollback-rejection negative scenario. Line 2784 cites 'v8 OBJ-10' when worktree-scoping is v9 OBJ-4. Endorsed by 3 experts.
- [bdd] Fairness additions WF_vars(UserRequestsRollback(w)) (OBJ-12(v9)) and WF_vars(RouterTakesSnapshot(w)) (OBJ-13(v9)) are not represented in any scenario, including the WF-SF asymmetry scenario (2307-2316).
- [bdd] ModeratorEmitsCandidate ground-truth-per-objecting-agent guard (OBJ-10(v9)) is not represented in any scenario. Observable: 'consensus_candidate is not emitted until every agent with an unresolved objection has received a ground_truth in the current round.'
- [bdd] Three new v9/v10 hot-path actions have no performance budgets: (a) recipient-side TypeSenderACL doubles per-envelope ACL overhead — no combined from+to ACL p95 scenario; (b) handler-epoch guard runs on every HandlerAdapterCompletes — no p95 or bail-out frequency under checkpoint-heavy load; (c) RouterHaltsRollbackSqliteError detection/halt latency unbudgeted.
- [bdd] Still-open prior performance objections: dimensional arithmetic on line 2576 (50ms/16 agents = 3.1ms labeled per-agent ceiling — actually mean); line 2586 listener-poll cost flagged as 'NOT in budget' but budgeted nowhere; line 1253 Write-PipelineLog ceiling-hit-rate unbounded; evt_id allocator burst envelope for fan-out peaks missing; MaxEvtId production/model wiring scenario missing.
- [bdd] Item 25 Gherkin quality issues: scenario name at 2338 leaks implementation variable names; many Item 25 Then blocks have 7-9 And steps (TypeOK at 2248 has 8); no Item 25 scenario uses Examples tables despite the obvious fit. Scenarios at 2194/2230 still carry 'demoted in v8' archaeological framing.
- [bdd] Item 31 line 2979 explicitly says internal Envelope is not versioned — cross-aggregate contract (Router<->Agent<->HandlerAdapter) with no versioned artifact. Either confirm deliberately-unversioned or add bus/contracts/envelope-schema.json with its own semver gate.
- [bdd] ConsensusRound not named as Aggregate Root in glossary. v9 OBJ-7 resets consensusState, unresolvedObjections, overriddenObjections atomically on rollback — signature of an aggregate. Currently treated as three independent fields.
- [bdd] Continuous-delivery minors: (O-CD-1) rollback-specific baseline keys at 2791-2792 need explicit @skip-until-baseline-present annotation for first deploy; (O-CD-2) bus-smoke-test and metrics.json comparator at 2796-2805 are post-deploy — either add to required-check list or explicitly state they're enforced by deploy pipeline not branch protection.
- [tla] OBJ-A(v10) HIGH — Post-rollback ratification loophole via stale eventLog. RouterExecutesRollback (lines 1318-1320) correctly resets consensusState/unresolvedObjections/overriddenObjections (OBJ-7(v9)) but eventLog is immutable. ModeratorEmitsCandidate guard 'exists e in eventLog : e.type=objection' is trivially satisfied by pre-rollback events. RouterRatifiesConsensus can then fire immediately after rollback with zero new agent activity. OBJ-1(v8)'s zero-debate-ratification guarantee is defeated post-rollback. Independently converged by expert-tla and expert-edge-cases.
- [tla] OBJ-EC-2(v10) MEDIUM — RouterHaltsRollbackSqliteError (lines 1337-1344) has no commit-drain guard, orthogonal to OBJ-8(v9). OBJ-8(v9) added drain guard to RouterExecutesRollback to prevent silent-commit-drop; sibling action lacks it. If SQLite fails while rollback awaits commit drain, action halts atomically with commitLockHolder UNCHANGED — exactly the pattern OBJ-8 meant to close.
- [tla] OBJ-C(v10) MEDIUM — Rollback + Ctrl+C deadlock. If UserInterrupts fires while rollbackRequested=TRUE, bus halts with haltReason='user_interrupt'. UserResumes is guarded by ~rollbackRequested and never fires. Both RouterExecutesRollback and RouterHaltsRollbackSqliteError require BusRunning. rollbackRequested persists forever. RollbackEventuallyCompletes formally discharged via halt disjunct, but state is unrecoverable for rollback subsystem.
- [tla] OBJ-E(v10) MEDIUM — Halted-state /rollback structurally unreachable. UserRequestsRollback accepts firing from busStatus in {running, halted, resuming} (line 1279) but both executing actions require BusRunning, which cannot be re-entered while rollbackRequested=TRUE (because UserResumes is blocked by ~rollbackRequested). Fix coupled with the Ctrl+C resolution.
- [tla] OBJ-EC-3(v10) MEDIUM — RouterHaltsRollbackSqliteError does NOT reset consensus state (lines 1337-1355). Asymmetric with OBJ-7(v9)'s 'rollback is clean slate' principle in RouterExecutesRollback. Between SQLite error and retry-after-Resume, consensus machinery is in pre-halt state.
- [tla] OBJ-B(v10) MEDIUM — OBJ-10(v9) ground-truth guard becomes over-strict post-rollback. Quantifier scans eventLog for pre-rollback objections; if original objector has been respawned (groundTruthDelivered=FALSE), consensus is blocked until they are re-briefed. Functionally conservative but unintuitive. Resolved by OBJ-A's epoch scoping.
- [tla] OBJ-D(v10) LOW — RouterHaltsRollbackSqliteError is always enabled whenever BusRunning and rollbackRequested, with no fairness and no 'SQLite operation in progress' flag. TLC explores error path from every pre-rollback state. Conservative but deserves a comment documenting this as deliberate always-enabled nondeterministic fault injection.
- [tla] Documentation gaps (LOW): (a) snapshot retention modeling simplification — snapshotExists :: BOOLEAN allows at most one per worktree; BDD permits up to 10 with eviction; add header-comment explaining this is sound given |Worktrees|=1 and RollbackRequiresSnapshot; (b) MaxEvtId production/model gap not cross-wired — add one-line comment that RouterHaltsBoundReached is structurally identical at MaxEvtId=4 and Int64.MaxValue; (c) name ConsensusRound as aggregate coordinated with BDD glossary.

## Round 9

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-bdd, expert-ddd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-performance

### Objections
- [bdd] CRITICAL — BDD line 2488 (RouterHaltsRollbackSqliteError scenario) explicitly asserts the ConsensusRound aggregate (consensusState, unresolvedObjections, overriddenObjections) is NOT reset, but TLA+ v11 OBJ-EC-3 (lines 1510-1513) now resets all three plus consensusRoundStart. BDD assertion is now formally false against the spec it claims to verify. Endorsed by expert-tla, expert-bdd, expert-tdd, expert-edge-cases, expert-ddd.
- [bdd] CRITICAL — Pervasive v11 version-label drift (4th consecutive round). Header line 5 still says 'TLA+ version: v10'; zero occurrences of v11 in 3447-line BDD; every Item 25 'TLA+ traceability (v10)' citation is now one generation stale. Endorsed by expert-tla, expert-bdd, expert-tdd, expert-ddd.
- [bdd] HIGH — No BDD scenario for new v11 RouterAbortsStaleRollback action (TLA lines 1540-1556). The Ctrl+C-during-rollback recovery path and halted-state /rollback path have zero stakeholder-visible Gherkin coverage. Required: scenarios for (a) Ctrl+C during pending rollback → abort fires → snapshot preserved → -Resume succeeds → /rollback can be re-issued; (b) halted-state /rollback auto-aborts; (c) WF fairness liveness. Endorsed by expert-tla, expert-bdd, expert-tdd, expert-edge-cases, expert-ddd.
- [bdd] HIGH — No BDD scenario for new v11 consensusRoundStart epoch (TLA lines 387, 466, 527, 958-961, 1462, 1513). The ModeratorEmitsCandidate scenario at bdd line 2530 must be extended to assert 'consensus_candidate is not emitted using objection events whose evt_id < consensusRoundStart'. Required: red-then-green scenarios for (a) post-rollback fresh round ignores pre-rollback objections; (b) RouterHaltsRollbackSqliteError advances epoch; (c) OBJ-B coupling (pre-rollback objector with groundTruthDelivered=FALSE does not block fresh round). Endorsed by expert-tla, expert-bdd, expert-tdd, expert-ddd.
- [bdd] HIGH — bdd line 2198 (CandidateHasEventInLog scenario) describes wrong epoch scoping: says 'e.evt_id >= spawnedAtEvt[a]' (agent-lifetime epoch) but TLA+ v11 line 1827 uses 'e.evt_id >= consensusRoundStart' (consensus-round epoch). Different semantics — agent lifetime resets on respawn; consensus round resets on rollback. The invariant the BDD describes is not the invariant the TLA+ checks. Endorsed by expert-tla.
- [bdd] MEDIUM — BDD glossary (lines 56-63) lacks v11 vocabulary. Missing entries: consensusRoundStart (epoch boundary marker), RouterAbortsStaleRollback (halt-time abort action). Existing ConsensusRound entry (line 63) cites only RouterExecutesRollback as reset action; v11 OBJ-EC-3 means RouterHaltsRollbackSqliteError also resets — entry must be amended to 'reset atomically by RouterExecutesRollback and by RouterHaltsRollbackSqliteError (v11 OBJ-EC-3)'. Endorsed by expert-ddd, expert-bdd.
- [bdd] MEDIUM — All 35+ 'cfg line XXX' citations in BDD Item 25 are now numerically wrong because v11 cfg expanded its header. NoOrphanedHandlerForDeadAgent is at cfg line 169 but BDD cites 132; GroundTruthPrecedesAgentMessage at 157 but BDD cites 120. Stakeholder-facing citations point to wrong lines. Endorsed by expert-tla.
- [bdd] MEDIUM — ModeratorEmitsCandidate eventLog-scan p95 unbudgeted in Item 27. v11 added a second universal quantifier (TLA lines 958-961) scoped to consensusRoundStart on a hot path. Required: (a) p95 budget for guard-eval; (b) EXPLAIN QUERY PLAN verification of no full-table scan on event_log; (c) baseline key. Endorsed by expert-performance.
- [bdd] MEDIUM — RouterAbortsStaleRollback unbudgeted in Item 27. v11's new action has no detection-to-clear latency budget. Recommend baseline key 'rollback_abort_stale_latency_ms' symmetric with the rollback_sqlite_error_halt_latency_ms gate. Endorsed by expert-performance.
- [bdd] MEDIUM — Halted-state /rollback user-experience semantically undefined. v11 makes /rollback against halted bus a silent auto-abort (via RouterAbortsStaleRollback). BDD /rollback CLI scenarios (~2732-2794) do not describe this. Either tighten TLA UserRequestsRollback to BusRunning OR add BDD scenario stating halted-state /rollback is auto-aborted with user-visible feedback. Endorsed by expert-edge-cases.
- [bdd] MEDIUM — Item 30 stage-level seam scenarios lack concrete mock-interaction examples. Test stubs at Send-BusEvent/Wait-BusGroup boundary lack call-record assertion examples (e.g., 'the stub records one call with envelope type=verify, from=tla-writer, to=tlc'). For handler-epoch guard, no guidance on unit vs integration boundary. Endorsed by expert-tdd.
- [bdd] LOW — Heartbeat listener poll cost referenced at bdd:2753 but no scenario drives the 'heartbeat_listener_poll_p95_ms' baseline key. Either add scenario or mark observational-only. Endorsed by expert-performance (carried from prior round).
- [bdd] LOW — Write-PipelineLog ceiling-hit rate per second still unbounded. Endorsed by expert-performance (carried from prior round).
- [bdd] LOW — Item 29 exit-code mapping silent on RouterAbortsStaleRollback path. Recommend explicit one-line: 'RouterAbortsStaleRollback fires post-halt and does not change the exit code (already exit 1 from user_interrupt or 10-16 from mechanical halt)'. Endorsed by expert-cd, expert-bdd.
- [bdd] LOW — Gherkin quality: scenario at bdd:2418 ('Handler epoch mismatch') uses two When clauses; consider splitting into Given (crash + respawn) / When (handler completes late) / Then (router rejects). Scenario at bdd:2488 (after OBJ-EC-3 fix) should rewrite the negated 'is NOT reset' assertion as affirmative 'IS reset to consensusState=open, unresolvedObjections=∅, overriddenObjections=∅'. Endorsed by expert-bdd.
- [tla] LOW — Document consensusRoundStart's monotone-non-decreasing invariant. Add an INVARIANT (or comment) asserting 'consensusRoundStart \in 1..(nextEvtId + 1) /\ consensusRoundStart <= nextEvtId + 1'. Consider an explicit safety property ConsensusRoundStartMonotone. Endorsed by expert-tla.
- [tla] LOW — RouterAbortsStaleRollback / UserRequestsRollback WF loop in halted state. After abort, rollbackRequested=FALSE and snapshot preserved; UserRequestsRollback is then re-enabled (busStatus='halted' is permitted at TLA line 1418). Both actions enabled in halted+rollbackRequested=FALSE state. Not a safety violation but introduces a non-progressing WF loop on halted state that may show up as model-checking performance cost or spurious 'fair' behavior where UserResumes is repeatedly deferred. Consider adding ~rollbackRequested turnover tracking or tightening UserRequestsRollback to busStatus /= halted \/ haltReason = NULL. Endorsed by expert-tla.
- [tla] LOW — RouterAbortsStaleRollback bypasses commit-drain guard. RouterExecutesRollback and RouterHaltsRollbackSqliteError both require commitLockHolder drain; abort does not. Correct because abort does no SQLite/commit work, but Ctrl+C-during-rollback may have fired while a commit was in flight. Document explicitly or add the drain guard for symmetry. Endorsed by expert-tla.
- [tla] LOW — RouterAbortsStaleRollback has no rollbackTargetWorktree-NULL precondition. If rollbackTargetWorktree=NULL while rollbackRequested=TRUE is reachable, the rollbackTargetWorktree' = NULL assignment (TLA:1544) is a no-op — still safe. Worth a one-line comment asserting RollbackRequiresSnapshot is preserved across abort. Endorsed by expert-edge-cases.

## Round 10

**Result:** PARTIAL_CONSENSUS
**Experts:** expert-tla, expert-bdd, expert-ddd, expert-tdd, expert-edge-cases, expert-continuous-delivery, expert-performance

### Objections
- [bdd] CRITICAL: Scenario at lines 2552-2568 asserts 'UserRequestsRollback fires and sets rollbackRequested=TRUE (the TLA+ action accepts busStatus=halted)' — v12 OBJ-LOW-2 (TLA+ line 1481) tightened the guard to {running, resuming}; the action cannot fire from halted. Rewrite as @negative CLI-rejection scenario.
- [bdd] CRITICAL: Item 28 scenario at lines 3170-3180 ('/rollback against a halted bus is auto-aborted via RouterAbortsStaleRollback') describes the same v12-forbidden UserRequestsRollback transition. Rewrite as CLI-layer rejection with exit-code preservation.
- [bdd] CRITICAL: WF fairness liveness scenario at lines 2571-2583 asserts 'verifies both entry paths: (a) UserInterrupts-then-RouterAbortsStaleRollback and (b) UserRequestsRollback(halted)-then-RouterAbortsStaleRollback'. Path (b) is unreachable in v12; drop it from the test.
- [bdd] HIGH: Header line 5 still says 'TLA+ version: v11'; 93 v11 references and 0 v12 references throughout. All 35 '# TLA+ traceability (v11):' comments in Item 25 must advance to (v12). 4th consecutive round of one-version-lag drift.
- [bdd] HIGH: No BDD scenario covers the new v12 ConsensusRoundStartMonotone named invariant (cfg INVARIANT 21; TLA+ lines 1975-1976 'consensusRoundStart <= nextEvtId'). Add @primary @integration scenario asserting the bound holds at every router transition.
- [bdd] HIGH: No @negative scenario for the v12-tightened UserRequestsRollback guard. Required: when user issues /rollback with busStatus=halted, CLI rejects upstream of any TLA+ transition with guidance to run -Resume first.
- [bdd] MEDIUM: Glossary entry for UserRequestsRollback (line 59) describes pre-v12 semantics ('gated on BusRunning'). Must state v12 OBJ-LOW-2 widened the guard to {running, resuming} and explicitly removed 'halted' to break a WF cycle; user must -Resume before issuing /rollback post-halt.
- [bdd] MEDIUM: Glossary entry for RouterAbortsStaleRollback (line 65) does not note that entry path 2 (halted-state /rollback) is unreachable after v12 OBJ-LOW-2; only entry path 1 (Ctrl+C while in flight) survives. Also missing OBJ-LOW-3 commit-drain absence rationale.
- [bdd] MEDIUM: Glossary entry for consensusRoundStart (line 66) does not cite the new v12 OBJ-LOW-1 monotone-bound invariant. ConsensusRoundStartMonotone must be added as a glossary entry of its own.
- [bdd] MEDIUM: Item 27 missing baseline key for CLI-rejection-to-exit p95 latency on halted-bus /rollback ('rollback_halted_bus_reject_cli_latency_ms'). Distinct from existing rollback_abort_stale_latency_ms which measures router-side state clearing.
- [bdd] MEDIUM: Item 27 missing baseline keys for per-envelope router routing p95 (router_route_envelope_p95_ms) and commit-serializer absolute-ceiling p95 (commit_serializer_p95_ms). Both are user-visible hot-paths assumed throughout but never bounded.
- [bdd] MEDIUM: tests/bus/performance-baselines.json schema is undefined. Item 27 references it 47 times with ~15 distinct keys but no required-keys list, percentile semantics, measurement-window convention, or baseline-capture-context (git SHA, machine class, sample size).
- [bdd] MEDIUM: Item 29 line 3310 exit-code clause for RouterAbortsStaleRollback must be qualified: case 1 (Ctrl+C path) preserves exit 1; case 2 (halted-state /rollback) is now a CLI-layer rejection with distinct exit semantics.
- [bdd] LOW: @unit tag used in Item 35 line 3573 but absent from the tag taxonomy at lines 10-17. CI-matrix generator has no source-of-truth.
- [bdd] LOW: Aggregate Root description (line 67) says 'these four fields must always be read and written together' but only three are the ConsensusRound aggregate (consensusRoundStart is a paired epoch marker, not a field of the aggregate).
- [bdd] LOW: No @failure_recovery scenario for repeated Ctrl+C abort cycles — three consecutive Ctrl+C-during-rollback cycles with the same snapshot, snapshot persists across all aborts, final retry succeeds after -Resume.
- [tla] MEDIUM: consensusRoundStart = MaxEvtId+1 boundary case undocumented. When the epoch reaches MaxEvtId+1 (after rollbacks), the e.evt_id >= consensusRoundStart guard in ModeratorEmitsCandidate becomes unsatisfiable. Safe (RouterHaltsBoundReached pre-empts) but should have an inline comment near TLA+ line 1012 or near RouterHaltsBoundReached.
- [tla] LOW: ConsensusRoundStartMonotone is misnamed — the invariant asserts a bound (consensusRoundStart <= nextEvtId), not monotonicity ([consensusRoundStart' >= consensusRoundStart]_vars). Either rename to ConsensusRoundStartBounded or add the actual monotone safety property.
- [tla] LOW: RouterAbortsStaleRollback action body comment should explicitly state haltReason and failureCategory are UNCHANGED (already in the UNCHANGED tuple) for downstream readers tracking exit-code preservation.


