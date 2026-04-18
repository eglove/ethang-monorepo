--------------------------- MODULE BidirectionalComms ---------------------------
\* TLA+ specification for the vibe-cli bidirectional agent communication bus.
\*
\* v12 — absorbs 4 LOW debate objections from the sixth unified-debate session (2026-04-18).
\*
\* Changes from v11:
\*
\*   OBJ-LOW-1(v12) ConsensusRoundStartMonotone safety property added.
\*              New named INVARIANT asserting consensusRoundStart <= nextEvtId.
\*              Captures that the epoch marker always refers to a position at or before the
\*              current event frontier; the +1 range in TypeOK covers the Init/advance
\*              moment but the tighter ≤ is always satisfied in practice.
\*              consensusRoundStart is initialized to 1 (= nextEvtId at Init) and advanced
\*              by setting consensusRoundStart' = nextEvtId (current, not +1), so the ≤
\*              relationship is preserved after every transition.  Added to INVARIANT list
\*              in .cfg as invariant 21; NoOrphanedHandlerForDeadAgent renumbered to 22.
\*
\*   OBJ-LOW-2(v12) UserRequestsRollback: "halted" removed from busStatus guard.
\*              Previously: busStatus \in {"running", "halted", "resuming"}.
\*              Now:        busStatus \in {"running", "resuming"}.
\*              Rationale: allowing "halted" created a non-progressing WF loop.
\*              After RouterAbortsStaleRollback clears rollbackRequested = FALSE,
\*              UserRequestsRollback was immediately re-enabled (snapshot preserved,
\*              busStatus = "halted" still matches), and RouterAbortsStaleRollback
\*              was re-enabled in turn — a cycle that WF obligations compelled
\*              indefinitely, deferring UserResumes and causing model-checking cost.
\*              Removing "halted" eliminates this entry path.  RouterAbortsStaleRollback
\*              remains needed for case 1 (Ctrl+C while rollback in flight: UserInterrupts
\*              fires while rollbackRequested = TRUE, leaving bus halted with pending
\*              rollback that can never execute).  The halted-state /rollback (OBJ-E(v10)
\*              case 2) is no longer modeled; the user must -Resume before issuing
\*              /rollback.
\*
\*   OBJ-LOW-3(v12) RouterAbortsStaleRollback: explicit comment on commit-drain guard absence.
\*              RouterExecutesRollback and RouterHaltsRollbackSqliteError both require
\*              '\A w : commitLockHolder[w] = NULL' before firing.  RouterAbortsStaleRollback
\*              intentionally omits this guard: abort performs no SQLite or commit work
\*              and does not touch commitLockHolder.  If a commit is in flight when
\*              Ctrl+C fires, the abort races the commit; commitLockHolder is cleared by
\*              RouterCommitSucceeds or RouterCommitFails independently.
\*              CommitLockHolderAliveOrBusHalted (invariant 5) covers the resulting state:
\*              after abort the bus is still halted, satisfying the "busStatus /= running"
\*              disjunct even with a non-NULL lock holder.
\*
\*   OBJ-LOW-4(v12) RouterAbortsStaleRollback: comment asserting RollbackRequiresSnapshot
\*              is preserved across abort.
\*              The action sets rollbackRequested' = FALSE and rollbackTargetWorktree' = NULL.
\*              It does NOT touch snapshotExists.  After abort, rollbackRequested = FALSE
\*              makes the antecedent of RollbackRequiresSnapshot (rollbackRequested => ...)
\*              vacuously false — the invariant is trivially satisfied.  The snapshot
\*              (snapshotExists[w]) is preserved deliberately so the user may re-issue
\*              /rollback after -Resume.  If rollbackTargetWorktree were already NULL when
\*              abort fires (which RollbackRequiresSnapshot prevents — the invariant
\*              requires rollbackTargetWorktree /= NULL whenever rollbackRequested = TRUE),
\*              the assignment rollbackTargetWorktree' = NULL would be a no-op.  The
\*              invariant is checked before and after; TLC verifies this guarantee.
\*
\* v11 — absorbs 8 debate objections from the sixth unified-debate session (2026-04-18).
\*
\* Changes from v10:
\*
\*   OBJ-A(v10) HIGH: consensusRoundStart epoch variable added.
\*              New variable: consensusRoundStart :: 1..(MaxEvtId+1).
\*              Initialized to 1 (start of the first consensus round).
\*              RouterExecutesRollback sets consensusRoundStart' = nextEvtId.
\*              RouterHaltsRollbackSqliteError sets consensusRoundStart' = nextEvtId.
\*              ModeratorEmitsCandidate objection guard scoped to current round:
\*                '\E e \in eventLog : e.type = "objection" /\ e.evt_id >= consensusRoundStart'
\*              Prevents pre-rollback objections from satisfying the guard in a fresh
\*              post-rollback consensus round (RouterRatifiesConsensus would otherwise
\*              fire immediately after rollback with zero new agent activity).
\*
\*   OBJ-B(v10) MEDIUM: Resolved by OBJ-A epoch scoping.
\*              OBJ-10(v9)'s ground-truth guard in ModeratorEmitsCandidate now also
\*              scoped to consensusRoundStart:
\*                '\A e \in eventLog : (e.type="objection" /\ e.from \in Agents
\*                                      /\ e.evt_id >= consensusRoundStart) =>
\*                                       groundTruthDelivered[e.from]'
\*              Pre-rollback objectors whose agents were respawned (groundTruthDelivered
\*              reset to FALSE) no longer block the new consensus round.
\*
\*   OBJ-C(v10) MEDIUM: RouterAbortsStaleRollback new action.
\*              Fires when busStatus = "halted" /\ rollbackRequested = TRUE.
\*              Clears rollbackRequested and rollbackTargetWorktree, unblocking
\*              UserResumes (which is guarded by ~rollbackRequested).
\*              Entry paths: (1) UserInterrupts fires while rollback pending — bus halts
\*              with haltReason = "user_interrupt", rollbackRequested persists, system
\*              enters unrecoverable state for rollback subsystem without this action.
\*              (2) UserRequestsRollback fires from busStatus = "halted" — rollback cannot
\*              execute (needs BusRunning); UserResumes blocked; deadlock without abort.
\*              WF_vars(RouterAbortsStaleRollback) in Fairness ensures eventual abort.
\*              The snapshot (snapshotExists[w]) is preserved; user may re-issue /rollback
\*              after -Resume.
\*
\*   OBJ-D(v10) LOW: Comment added to RouterHaltsRollbackSqliteError documenting the
\*              deliberate always-enabled nondeterministic fault injection pattern.
\*              No "SQLite operation in progress" flag exists — TLC explores the failure
\*              path from every pre-rollback state (after commit drain).  This is
\*              intentional: the spec proves safety and liveness hold for all orderings.
\*
\*   OBJ-E(v10) MEDIUM: Resolved by RouterAbortsStaleRollback (OBJ-C fix).
\*              UserRequestsRollback from busStatus="halted" was structurally unreachable
\*              as a live path because executing actions require BusRunning and UserResumes
\*              is blocked by rollbackRequested.  RouterAbortsStaleRollback breaks the
\*              deadlock.
\*
\*   OBJ-EC-2(v10) MEDIUM: RouterHaltsRollbackSqliteError: commit-drain guard added.
\*              '\A w \in Worktrees : commitLockHolder[w] = NULL' added (parallel with
\*              OBJ-8(v9)'s RouterExecutesRollback guard).  Without this, halting while
\*              a commit is in flight leaves commitLockHolder non-NULL — silently dropping
\*              an in-flight commit (exactly the pattern OBJ-8 meant to close).
\*              SF on RouterCommitSucceeds guarantees eventual drain.
\*
\*   OBJ-EC-3(v10) MEDIUM: RouterHaltsRollbackSqliteError: resets consensusState = "open",
\*              unresolvedObjections = {}, overriddenObjections = {}.  Symmetric with
\*              OBJ-7(v9)'s "rollback is clean slate" principle in RouterExecutesRollback.
\*              The failure path is also a clean slate: between SQLite error and
\*              retry-after-Resume, the consensus machinery must not carry pre-halt state.
\*              Also sets consensusRoundStart' = nextEvtId (OBJ-A coupling).
\*
\*   Documentation gaps (LOW):
\*   (a) snapshotExists: header comment added explaining that BOOLEAN models at-most-one
\*       snapshot per worktree.  BDD allows up to 10 with eviction; this simplification
\*       is sound given |Worktrees| = 1 and RollbackRequiresSnapshot.
\*   (b) RouterHaltsBoundReached: comment added that the action is structurally identical
\*       at MaxEvtId=4 (model) and Int64.MaxValue (production); the threshold is a model
\*       parameter, not a protocol invariant.
\*   (c) ConsensusRound: named and explained in a header comment near the consensus section.
\*       consensusRoundStart is the BDD-glossary-aligned epoch marker.
\*
\* v10 — TLC verification fix (2026-04-18).
\*
\* Changes from v9:
\*
\*   FIX-1(v10) RouterHaltsFeatureComplete: added failureCategory' = NULL.
\*              After a mechanical-error halt + resume cycle, failureCategory retains
\*              the previous halt's category.  When RouterHaltsFeatureComplete then
\*              fires it sets haltReason = "feature_complete" but left failureCategory
\*              unchanged — violating OBJ-15(v9)'s bidirectional invariant
\*              (haltReason /= "mechanical_error" => failureCategory = NULL).
\*              Fix: explicit failureCategory' = NULL assignment, matching the pattern
\*              already used by UserInterrupts and RouterExecutesRollback.
\*
\*   FIX-2(v10) RouterRatifiesConsensus: same fix (failureCategory' = NULL).
\*              Same stale-variable exposure: if a mechanical halt occurred before the
\*              current run then the resumed bus carries a non-NULL failureCategory that
\*              RouterRatifiesConsensus would leave intact on the next halt.
\*
\*   FIX-3(v10) RouterFailsConsensus: same fix (failureCategory' = NULL).
\*              Identical root cause as FIX-2.
\*
\* v9 — absorbs 15 debate objections from the fifth unified-debate session (2026-04-18).
\*
\* Changes from v8:
\*
\*   OBJ-1(v9)  RouterExecutesRollback: added BusRunning guard.
\*              Without this guard the action fired while busStatus = "halted",
\*              atomically overwriting haltReason (e.g. "consensus_ratified" → "user_rollback").
\*
\*   OBJ-2(v9)  UserResumes: added ~rollbackRequested guard.
\*              User cannot -Resume a halted bus while a rollback is pending; doing so
\*              would return the bus to "running" and then RouterExecutesRollback would
\*              fire immediately (OBJ-1 fix), but the interleaving is semantically
\*              ambiguous.  Guard eliminates the ambiguity: rollback must complete or
\*              fail before the bus is resumed.
\*
\*   OBJ-3(v9)  RouterTakesSnapshot: added ~rollbackRequested guard.
\*              A new snapshot taken after rollback is requested but before execution
\*              would invalidate the rollback target (target was selected when
\*              UserRequestsRollback(w) fired; a later snapshot for the same w would
\*              replace snapshotExists[w] = TRUE and be the silent target of the
\*              already-in-flight rollback).
\*
\*   OBJ-4(v9)  Rollback worktree scoping.
\*              New variable: rollbackTargetWorktree :: Worktrees ∪ {NULL}.
\*              UserRequestsRollback(w) now takes a worktree parameter and sets
\*              rollbackTargetWorktree' = w.  RouterExecutesRollback guards
\*              snapshotExists[rollbackTargetWorktree] (must exist for the specific
\*              target) and only clears snapshotExists for that worktree.
\*              RollbackRequiresSnapshot strengthened: rollbackRequested =>
\*              rollbackTargetWorktree /= NULL /\ snapshotExists[rollbackTargetWorktree].
\*              Cross-worktree rollback (snapshot for wt1, rollback applied to wt2) is
\*              now unreachable.
\*
\*   OBJ-5(v9)  TypeSenderACL: to-side (recipient) constraints added.
\*              From-side (sender) constraints were already in v8.  v9 adds:
\*              bootstrap/ground_truth/checkpoint/protocol_error/verify_result/
\*              review_verdict → must go to Agents; done/objection/objection_response/
\*              consensus_candidate/checkpoint_response/protocol_error_ack → must go to
\*              "router"; consensus_ratified/consensus_failed → must go to "broadcast";
\*              verify → must go to Handlers; review_requested → Agents or "broadcast".
\*
\*   OBJ-6(v9)  NoOrphanedHandlerForDeadAgent invariant added.
\*              Asserts: \A a \in Agents : agentStatus[a] = "dead" =>
\*                \A h \in Handlers : handlerPendingAgent[h] /= a.
\*              AgentCrashes already clears handler state atomically; this invariant
\*              verifies that guarantee is maintained across all paths.
\*
\*   OBJ-7(v9)  RouterExecutesRollback: resets consensusState = "open",
\*              unresolvedObjections = {}, overriddenObjections = {}.
\*              Without the reset, CandidateHasEventInLog would be satisfied by a
\*              pre-rollback consensus_candidate entry in the immutable eventLog even
\*              after consensusState advanced to "candidate" in a new (post-rollback)
\*              consensus round that skipped the candidate emission step.  Rollback
\*              is a clean slate; the consensus machine restarts.
\*
\*   OBJ-8(v9)  RouterExecutesRollback: added commit-drain guard.
\*              \A w \in Worktrees : commitLockHolder[w] = NULL must hold before
\*              rollback fires.  Without this, RouterExecutesRollback atomically cleared
\*              the lock AND halted, which satisfies CommitLockHolderAliveOrBusHalted by
\*              construction but silently drops an in-flight commit.  The drain guard
\*              forces RouterCommitSucceeds/RouterCommitFails to resolve first.
\*              WF on RouterCommitSucceeds (SF, existing) guarantees eventual drain.
\*
\*   OBJ-9(v9)  Handler instance epoch tracking.
\*              New variable: handlerPendingEpoch :: [Handlers -> (1..MaxEvtId+1) ∪ {NULL}].
\*              HandlerAdapterReceives records spawnedAtEvt[a] at call time.
\*              HandlerAdapterCompletes guards spawnedAtEvt[a] = handlerPendingEpoch[h]:
\*              if the agent has since been respawned (different epoch), the completion
\*              is rejected.  Belt-and-suspenders: primary protection is still the
\*              RouterInitiatesCheckpoint handler-busy guard (OBJ-3 from v8).
\*              AgentCrashes and HandlerFails clear the epoch.
\*              HandlerStateConsistency updated to include epoch.
\*
\*   OBJ-10(v9) ModeratorEmitsCandidate: ground-truth guard extended to all objecting agents.
\*              v8 added groundTruthDelivered[a] (moderator must be briefed).  v9 adds:
\*              \A e \in eventLog : (e.type = "objection" /\ e.from \in Agents) =>
\*                groundTruthDelivered[e.from].
\*              Prevents ratification built on objections raised by agents that had
\*              not yet received their full context (ground truth).
\*
\*   OBJ-11(v9) RouterHaltsRollbackSqliteError: new action.
\*              RouterHaltsSqliteError guards on agent states {"spawning","checkpointing",
\*              "renewing"} — it covers SQLite errors during agent-session writes.
\*              Rollback involves separate SQLite operations (clearing bus_snapshots,
\*              updating committed state).  RouterHaltsRollbackSqliteError fires when
\*              rollbackRequested = TRUE and BusRunning, halting with failureCategory =
\*              "sqlite_error".  rollbackRequested and rollbackTargetWorktree are cleared
\*              (rollback failed; user may retry after -Resume).
\*
\*   OBJ-12(v9) Fairness: WF_vars(UserRequestsRollback(w)) added for all w.
\*              Without this, TLC's scheduler can permanently starve UserRequestsRollback,
\*              allowing snapshotExists[w] = TRUE to persist indefinitely without a
\*              rollback request being filed.  Adding WF models the guarantee that when
\*              conditions are met the user CLI eventually exercises /rollback.
\*              Note: this is a modeling conservative — it compels rollback when enabled.
\*              UserInterrupts retains no fairness (Ctrl+C is more truly ad-hoc).
\*
\*   OBJ-13(v9) Fairness: WF_vars(RouterTakesSnapshot(w)) added for all w.
\*              Without this, snapshotExists[w] could stay FALSE forever, so
\*              UserRequestsRollback is never enabled, so RollbackEventuallyCompletes
\*              holds vacuously (rollback never requested means ~(rollbackRequested=TRUE)
\*              is never true in the antecedent).  WF on RouterTakesSnapshot closes this.
\*
\*   OBJ-14(v9) State-space budget note updated (see .cfg).
\*
\*   OBJ-15(v9) MechanicalHaltHasCategory strengthened: bidirectional.
\*              v8 checked only: haltReason = "mechanical_error" => failureCategory in set.
\*              v9 adds: haltReason /= "mechanical_error" => failureCategory = NULL.
\*              Prevents semantic halts (feature_complete, consensus_ratified, etc.) from
\*              carrying a spurious failureCategory value that would misidentify the
\*              halt in downstream processing.
\*
\* ---- Retained from v8 ----
\*
\*   OBJ-1(v8)  ModeratorEmitsCandidate: +groundTruthDelivered[a] guard; +objection guard.
\*   OBJ-2(v8)  RouterHaltsSqliteError: narrowed to {"spawning","checkpointing","renewing"}.
\*   OBJ-3(v8)  RouterInitiatesCheckpoint: +handler-busy guard; AgentCrashes: handler reset;
\*              Fairness: +WF(HandlerFails).
\*   OBJ-4(v8)  evt_id-exhaustion + protocol-error interaction (documented, no change).
\*   OBJ-5(v8)  MechanicalHaltHasCategory added (non-tautological; ExitCodeTotality demoted).
\*   OBJ-6(v8)  CandidateHasEventInLog added (non-vacuous; RatificationViaConsensusProtocol
\*              demoted).
\*   OBJ-7(v8)  TypeSenderACL added (from-side; v9 extends to to-side).
\*   OBJ-8(v8)  Fairness: +WF(ReleasePipelineLock).
\*   OBJ-9(v8)  HandlerStateConsistency added.
\*   OBJ-10(v8) /rollback: snapshotExists, rollbackRequested variables; RouterTakesSnapshot,
\*              UserRequestsRollback, RouterExecutesRollback; RollbackRequiresSnapshot;
\*              RollbackEventuallyCompletes; WF(RouterExecutesRollback).
\*   OBJ-11(v8) MaxEvtId modeling note added to CONSTANTS.

EXTENDS Integers, FiniteSets, TLC

\* =============================================================================
\* CONSTANTS
\* =============================================================================

CONSTANTS
    Agents,      \* Set of agent role names
    Handlers,    \* Set of native handler names: {"tlc", "tests", "git"}
    Worktrees,   \* Set of worktree paths (commit mutex modeling)
    GroupIds,    \* Set of group identifiers (fan-out groups)
    MaxEvtId,    \* Upper bound on evt_id for finite model checking.
                 \* OBJ-11(v8): MaxEvtId = 4 in .cfg is a model-checking constant for
                 \* state-space control only.  Production uses Int64.MaxValue
                 \* (9,223,372,036,854,775,807).  The evt_id_overflow halt is a real
                 \* protocol path; its trigger threshold is a model parameter, not a
                 \* protocol invariant.
    NULL         \* Sentinel: "not set"

\* =============================================================================
\* DERIVED SETS
\* =============================================================================

Peers == Agents \cup Handlers

EventTypes == {
    "bootstrap",          "ground_truth",        "done",
    "objection",          "objection_response",  "consensus_candidate",
    "consensus_ratified", "consensus_failed",
    "verify",             "verify_result",
    "review_requested",   "review_verdict",
    "checkpoint",         "checkpoint_response", "protocol_error",
    "protocol_error_ack"
}

\* OBJ-7(v8): Named event-type subsets.
ConsensusEventTypes == {
    "objection",          "objection_response",
    "consensus_candidate","consensus_ratified",  "consensus_failed"
}

ProtocolBookkeepingEventTypes == {
    "protocol_error", "protocol_error_ack"
}

DomainEventTypes == EventTypes \ (ConsensusEventTypes \cup ProtocolBookkeepingEventTypes)

AgentStatuses == {"spawning", "alive", "checkpointing", "renewing", "dead"}

\* OBJ-10(v8): "user_rollback" added — semantic terminal halt (exit code 0).
\* ReleasePipelineLock fires on this halt.  -Resume is NOT available after rollback.
HaltReasons == {
    "consensus_ratified",  \* semantic: normal exit
    "consensus_failed",    \* semantic: normal exit with reason
    "feature_complete",    \* semantic: normal exit
    "mechanical_error",    \* infrastructure failure
    "user_interrupt",      \* Ctrl+C
    "user_rollback"        \* /rollback command (semantic: clean exit, code 0)
}

\* OBJ-3(v7): "context_limit" removed — context exhaustion is handled by graceful
\* checkpointing, not a halt.
FailureCategories == {
    "duplicate_evt_id",
    "group_violation",
    "git_commit",
    "handler_failure",
    "sqlite_error",
    "agent_crash",
    "evt_id_overflow"
}

\* OBJ-5(v8) / OBJ-5(v9): ExitCodeOf is a proof-obligation helper, not checked as an
\* INVARIANT (tautological over a constant set).  Proof obligation by inspection:
\*   \A cat \in FailureCategories : ExitCodeOf(cat) /= 0  (trivially true from CASE).
ExitCodeOf(cat) ==
    CASE cat = "duplicate_evt_id" -> 10
      [] cat = "group_violation"  -> 11
      [] cat = "git_commit"       -> 12
      [] cat = "handler_failure"  -> 13
      [] cat = "sqlite_error"     -> 14
      [] cat = "agent_crash"      -> 15
      [] cat = "evt_id_overflow"  -> 16
      [] OTHER -> 0

BusStatuses    == {"running", "halted", "resuming"}
HandlerStatuses == {"idle", "busy"}

\* =============================================================================
\* VARIABLES
\* =============================================================================

VARIABLES
    \* --- Event tracking ---
    nextEvtId,          \* Nat: monotonically increasing ID allocator
    eventLog,           \* SET of {evt_id, from, to, type, inReplyTo, groupId}
    routedIds,          \* Set of evt_ids already dispatched (duplicate guard)

    \* --- Agent sessions ---
    agentStatus,        \* [Agents -> AgentStatuses]
    agentWorktree,      \* [Agents -> Worktrees ∪ {NULL}]
    checkpointStored,   \* [Agents -> BOOLEAN]
    checkpointResponseInFlight, \* [Agents -> BOOLEAN]

    \* --- Ground-truth delivery epoch ---
    groundTruthDelivered, \* [Agents -> BOOLEAN]

    \* --- Agent lifetime epoch markers ---
    spawnedAtEvt,       \* [Agents -> 1..(MaxEvtId+1)]
    deadAtEvt,          \* [Agents -> (1..(MaxEvtId+1)) ∪ {NULL}]

    \* --- Consensus ---
    unresolvedObjections,  \* SUBSET 1..MaxEvtId
    overriddenObjections,  \* SUBSET 1..MaxEvtId
    consensusState,        \* "open" | "candidate" | "ratified" | "failed"

    \* --- Commit serialization ---
    commitLockHolder,   \* [Worktrees -> Agents ∪ {NULL}]
    committedDoneEvts,  \* SUBSET 1..MaxEvtId
    pendingDoneEvt,     \* [Worktrees -> (1..MaxEvtId) ∪ {NULL}]

    \* --- Bus lifecycle ---
    busStatus,          \* BusStatuses
    haltReason,         \* HaltReasons ∪ {NULL}
    failureCategory,    \* FailureCategories ∪ {NULL}

    \* --- Group aggregate ---
    groupMembers,       \* [GroupIds -> SUBSET Agents]
    groupReplies,       \* [GroupIds -> SUBSET Agents]
    groupViolationPending, \* BOOLEAN

    \* --- Protocol error recovery ---
    pendingProtocolError, \* [Agents -> BOOLEAN]

    \* --- Handler anti-corruption boundary ---
    handlerState,       \* [Handlers -> HandlerStatuses]
    handlerPendingEvt,  \* [Handlers -> (1..MaxEvtId) ∪ {NULL}]
    handlerPendingAgent, \* [Handlers -> Agents ∪ {NULL}]

    \* --- OBJ-9(v9): Handler instance epoch ---
    \* Records spawnedAtEvt[a] at the moment HandlerAdapterReceives fires.
    \* HandlerAdapterCompletes guards that the epoch still matches: if the agent
    \* was respawned between receive and complete, the completion is blocked.
    \* Cleared by HandlerFails and AgentCrashes (same conditions as agent/evt fields).
    handlerPendingEpoch, \* [Handlers -> (1..(MaxEvtId+1)) ∪ {NULL}]

    \* --- OBJ-A(v10): Consensus round epoch marker ---
    \* Records the nextEvtId at the start of the current consensus round.
    \* Initialized to 1.  Advanced to nextEvtId by RouterExecutesRollback and
    \* RouterHaltsRollbackSqliteError (both issue a clean-slate reset).
    \* ModeratorEmitsCandidate guards scope their objection checks to events
    \* with evt_id >= consensusRoundStart, preventing pre-rollback events in the
    \* immutable eventLog from satisfying guards in a post-rollback round.
    \*
    \* BDD glossary alignment: "ConsensusRound" is the sequence of protocol events
    \* between two consecutive consensusRoundStart advances (or between Init and the
    \* first advance).  A round begins with at least one objection (raised by an alive,
    \* ground-truth-briefed agent), proceeds through candidate emission and
    \* objection resolution, and concludes with ratification or failure.
    consensusRoundStart, \* 1..(MaxEvtId+1)

    \* --- Pipeline mutex ---
    pipeline_lock,      \* BOOLEAN

    \* --- OBJ-10(v8): /rollback state ---
    \* Modeling simplification (doc gap a, v11): snapshotExists :: [Worktrees -> BOOLEAN]
    \* allows at most one snapshot per worktree.  The BDD permits up to 10 snapshots with
    \* LRU eviction.  This simplification is sound given |Worktrees| = 1 in the .cfg and
    \* the RollbackRequiresSnapshot invariant, which only tests snapshotExists[target].
    \* At |Worktrees| = 1 there is no multi-snapshot ordering to model.
    snapshotExists,     \* [Worktrees -> BOOLEAN]
    rollbackRequested,  \* BOOLEAN: /rollback command in flight

    \* --- OBJ-4(v9): Rollback worktree scoping ---
    \* Records which specific worktree the in-flight rollback targets.
    \* Set by UserRequestsRollback(w); cleared by RouterExecutesRollback and
    \* RouterHaltsRollbackSqliteError.  NULL when no rollback is pending.
    rollbackTargetWorktree \* Worktrees ∪ {NULL}

vars == <<
    nextEvtId, eventLog, routedIds,
    agentStatus, agentWorktree,
    checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
    spawnedAtEvt, deadAtEvt,
    unresolvedObjections, overriddenObjections, consensusState,
    commitLockHolder, committedDoneEvts, pendingDoneEvt,
    busStatus, haltReason, failureCategory,
    groupMembers, groupReplies, groupViolationPending,
    pendingProtocolError,
    handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
    pipeline_lock,
    snapshotExists, rollbackRequested, rollbackTargetWorktree,
    consensusRoundStart
>>

\* =============================================================================
\* TYPE INVARIANT
\* =============================================================================

TypeOK ==
    /\ nextEvtId \in 1..(MaxEvtId + 1)
    /\ eventLog \subseteq [
            evt_id    : 1..MaxEvtId,
            from      : Peers \cup {"router", "broadcast"},
            to        : Peers \cup {"router", "broadcast"},
            type      : EventTypes,
            inReplyTo : (1..MaxEvtId) \cup {NULL},
            groupId   : GroupIds \cup {NULL}
        ]
    /\ routedIds \subseteq 1..MaxEvtId
    /\ agentStatus \in [Agents -> AgentStatuses]
    /\ agentWorktree \in [Agents -> Worktrees \cup {NULL}]
    /\ checkpointStored \in [Agents -> BOOLEAN]
    /\ checkpointResponseInFlight \in [Agents -> BOOLEAN]
    /\ groundTruthDelivered \in [Agents -> BOOLEAN]
    /\ spawnedAtEvt \in [Agents -> 1..(MaxEvtId + 1)]
    /\ deadAtEvt \in [Agents -> (1..(MaxEvtId + 1)) \cup {NULL}]
    /\ unresolvedObjections \subseteq 1..MaxEvtId
    /\ overriddenObjections \subseteq 1..MaxEvtId
    /\ consensusState \in {"open", "candidate", "ratified", "failed"}
    /\ commitLockHolder \in [Worktrees -> Agents \cup {NULL}]
    /\ committedDoneEvts \subseteq 1..MaxEvtId
    /\ pendingDoneEvt \in [Worktrees -> (1..MaxEvtId) \cup {NULL}]
    /\ busStatus \in BusStatuses
    /\ haltReason \in HaltReasons \cup {NULL}
    /\ failureCategory \in FailureCategories \cup {NULL}
    /\ groupMembers \in [GroupIds -> SUBSET Agents]
    /\ groupReplies \in [GroupIds -> SUBSET Agents]
    /\ groupViolationPending \in BOOLEAN
    /\ pendingProtocolError \in [Agents -> BOOLEAN]
    /\ handlerState \in [Handlers -> HandlerStatuses]
    /\ handlerPendingEvt \in [Handlers -> (1..MaxEvtId) \cup {NULL}]
    /\ handlerPendingAgent \in [Handlers -> Agents \cup {NULL}]
    /\ handlerPendingEpoch \in [Handlers -> (1..(MaxEvtId + 1)) \cup {NULL}]
    /\ pipeline_lock \in BOOLEAN
    /\ snapshotExists \in [Worktrees -> BOOLEAN]
    /\ rollbackRequested \in BOOLEAN
    /\ rollbackTargetWorktree \in Worktrees \cup {NULL}
    /\ consensusRoundStart \in 1..(MaxEvtId + 1)

\* =============================================================================
\* HELPERS
\* =============================================================================

BusRunning  == busStatus = "running"
BusResuming == busStatus = "resuming"

AgentAlive(a)  == agentStatus[a] = "alive"
LockFree(w)    == commitLockHolder[w] = NULL

AppendEvent(from, to, type, inReplyTo, groupId) ==
    LET id  == nextEvtId
        rec == [evt_id    |-> id,
                from      |-> from,
                to        |-> to,
                type      |-> type,
                inReplyTo |-> inReplyTo,
                groupId   |-> groupId]
    IN  /\ (inReplyTo = NULL \/ inReplyTo \in routedIds)
        /\ nextEvtId' = nextEvtId + 1
        /\ eventLog'  = eventLog \cup {rec}
        /\ routedIds' = routedIds \cup {id}

\* =============================================================================
\* INIT
\* =============================================================================

Init ==
    /\ nextEvtId             = 1
    /\ eventLog              = {}
    /\ routedIds             = {}
    /\ agentStatus           = [a \in Agents |-> "spawning"]
    /\ agentWorktree         = [a \in Agents |-> NULL]
    /\ checkpointStored      = [a \in Agents |-> FALSE]
    /\ checkpointResponseInFlight = [a \in Agents |-> FALSE]
    /\ groundTruthDelivered  = [a \in Agents |-> FALSE]
    /\ spawnedAtEvt          = [a \in Agents |-> 1]
    /\ deadAtEvt             = [a \in Agents |-> NULL]
    /\ unresolvedObjections  = {}
    /\ overriddenObjections  = {}
    /\ consensusState        = "open"
    /\ commitLockHolder      = [w \in Worktrees |-> NULL]
    /\ committedDoneEvts     = {}
    /\ pendingDoneEvt        = [w \in Worktrees |-> NULL]
    /\ busStatus             = "running"
    /\ haltReason            = NULL
    /\ failureCategory       = NULL
    /\ groupMembers          = [g \in GroupIds |-> {}]
    /\ groupReplies          = [g \in GroupIds |-> {}]
    /\ groupViolationPending = FALSE
    /\ pendingProtocolError  = [a \in Agents |-> FALSE]
    /\ handlerState          = [h \in Handlers |-> "idle"]
    /\ handlerPendingEvt     = [h \in Handlers |-> NULL]
    /\ handlerPendingAgent   = [h \in Handlers |-> NULL]
    /\ handlerPendingEpoch   = [h \in Handlers |-> NULL]
    /\ pipeline_lock         = TRUE
    /\ snapshotExists        = [w \in Worktrees |-> FALSE]
    /\ rollbackRequested     = FALSE
    /\ rollbackTargetWorktree = NULL
    /\ consensusRoundStart   = 1

\* =============================================================================
\* ACTIONS — Agent lifecycle
\* =============================================================================

DeliverBootstrap(a, w) ==
    /\ busStatus \in {"running", "resuming"}
    /\ agentStatus[a] = "spawning"
    /\ agentWorktree[a] = NULL
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent("router", a, "bootstrap", NULL, NULL)
    /\ agentStatus'   = [agentStatus   EXCEPT ![a] = "alive"]
    /\ agentWorktree' = [agentWorktree EXCEPT ![a] = w]
    /\ UNCHANGED <<
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

DeliverGroundTruth(a) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent("router", a, "ground_truth", NULL, NULL)
    /\ groundTruthDelivered' = [groundTruthDelivered EXCEPT ![a] = TRUE]
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* OBJ-5(v7): WF correct here — acquires lock only when free (zero contention).
AgentSendsDone(a, w) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ agentWorktree[a] = w
    /\ LockFree(w)
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, "router", "done", NULL, NULL)
    /\ commitLockHolder' = [commitLockHolder EXCEPT ![w] = a]
    /\ pendingDoneEvt'   = [pendingDoneEvt   EXCEPT ![w] = nextEvtId]
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            committedDoneEvts,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* SF fairness (v6 OBJ-4): releases a held lock contested by multiple agents.
RouterCommitSucceeds(w) ==
    /\ BusRunning
    /\ commitLockHolder[w] /= NULL
    /\ pendingDoneEvt[w] /= NULL
    /\ commitLockHolder'  = [commitLockHolder EXCEPT ![w] = NULL]
    /\ committedDoneEvts' = committedDoneEvts \cup {pendingDoneEvt[w]}
    /\ pendingDoneEvt'    = [pendingDoneEvt   EXCEPT ![w] = NULL]
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

RouterCommitFails(w) ==
    /\ BusRunning
    /\ commitLockHolder[w] /= NULL
    /\ commitLockHolder' = [commitLockHolder EXCEPT ![w] = NULL]
    /\ pendingDoneEvt'   = [pendingDoneEvt   EXCEPT ![w] = NULL]
    /\ busStatus'        = "halted"
    /\ haltReason'       = "mechanical_error"
    /\ failureCategory'  = "git_commit"
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            committedDoneEvts,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* OBJ-3(v8): AgentCrashes atomically resets handler tracking for the crashing agent.
\* OBJ-9(v9): Also resets handlerPendingEpoch for affected handlers.
\* If handler h was processing agent a (handlerPendingAgent[h] = a), h is reset to
\* "idle" so HandlerAdapterCompletes cannot spuriously fire against a stale reference.
\* NoOrphanedHandlerForDeadAgent (OBJ-6(v9)) verifies this cleanup is complete.
AgentCrashes(a) ==
    /\ BusRunning
    /\ agentStatus[a] \in {"spawning", "alive", "checkpointing"}
    /\ ~checkpointResponseInFlight[a]
    /\ agentStatus'          = [agentStatus      EXCEPT ![a] = "dead"]
    /\ deadAtEvt'            = [deadAtEvt        EXCEPT ![a] = nextEvtId]
    /\ pendingProtocolError' = [pendingProtocolError EXCEPT ![a] = FALSE]
    /\ busStatus'            = "halted"
    /\ haltReason'           = "mechanical_error"
    /\ failureCategory'      = "agent_crash"
    /\ commitLockHolder'     = [w \in Worktrees |->
                                   IF commitLockHolder[w] = a THEN NULL
                                   ELSE commitLockHolder[w]]
    /\ pendingDoneEvt'       = [w \in Worktrees |->
                                   IF commitLockHolder[w] = a THEN NULL
                                   ELSE pendingDoneEvt[w]]
    /\ handlerState'         = [h \in Handlers |->
                                   IF handlerPendingAgent[h] = a THEN "idle"
                                   ELSE handlerState[h]]
    /\ handlerPendingEvt'    = [h \in Handlers |->
                                   IF handlerPendingAgent[h] = a THEN NULL
                                   ELSE handlerPendingEvt[h]]
    /\ handlerPendingAgent'  = [h \in Handlers |->
                                   IF handlerPendingAgent[h] = a THEN NULL
                                   ELSE handlerPendingAgent[h]]
    /\ handlerPendingEpoch'  = [h \in Handlers |->
                                   IF handlerPendingAgent[h] = a THEN NULL
                                   ELSE handlerPendingEpoch[h]]
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentWorktree, checkpointStored, checkpointResponseInFlight,
            groundTruthDelivered, spawnedAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            committedDoneEvts,
            groupMembers, groupReplies, groupViolationPending,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — Checkpoint (session renewal)
\* =============================================================================
\*
\* Checkpoint timer race (v6 OBJ-12): both RouterInitiatesCheckpoint and
\* AgentCrashes can fire from agentStatus = "alive".  TLC explores both orderings
\* non-deterministically.  If crash wins, RouterInitiatesCheckpoint is permanently
\* disabled (AgentAlive guard fails).  Correctly modeled as-is.

\* OBJ-10(v7) hotfix: ~pendingProtocolError[a] guard prevents checkpoint initiation
\* while a protocol error is pending.
\*
\* OBJ-3(v8): \A h : handlerPendingAgent[h] /= a guard prevents checkpoint initiation
\* while any handler is actively processing agent a.  Without this guard, the agent
\* could transition to "checkpointing" → "renewing" mid-handler, permanently disabling
\* HandlerAdapterCompletes (AgentAlive guard would fail for a "renewing" agent).
RouterInitiatesCheckpoint(a) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ groundTruthDelivered[a]
    /\ ~pendingProtocolError[a]
    /\ \A w \in Worktrees : commitLockHolder[w] /= a
    /\ \A h \in Handlers  : handlerPendingAgent[h] /= a
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent("router", a, "checkpoint", NULL, NULL)
    /\ agentStatus' = [agentStatus EXCEPT ![a] = "checkpointing"]
    /\ UNCHANGED <<
            agentWorktree, checkpointStored, checkpointResponseInFlight,
            groundTruthDelivered, spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

AgentCheckpointResponse(a) ==
    /\ BusRunning
    /\ agentStatus[a] = "checkpointing"
    /\ ~checkpointResponseInFlight[a]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, "router", "checkpoint_response", NULL, NULL)
    /\ checkpointStored'           = [checkpointStored           EXCEPT ![a] = TRUE]
    /\ agentStatus'                = [agentStatus                EXCEPT ![a] = "renewing"]
    /\ deadAtEvt'                  = [deadAtEvt                  EXCEPT ![a] = nextEvtId]
    /\ checkpointResponseInFlight' = [checkpointResponseInFlight EXCEPT ![a] = TRUE]
    /\ UNCHANGED <<
            agentWorktree, groundTruthDelivered, spawnedAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

RouterRespawnsAgent(a) ==
    /\ BusRunning
    /\ agentStatus[a] = "renewing"
    /\ checkpointStored[a]
    /\ checkpointResponseInFlight[a]
    /\ agentStatus'                = [agentStatus                EXCEPT ![a] = "spawning"]
    /\ agentWorktree'              = [agentWorktree              EXCEPT ![a] = NULL]
    /\ checkpointStored'           = [checkpointStored           EXCEPT ![a] = FALSE]
    /\ checkpointResponseInFlight' = [checkpointResponseInFlight EXCEPT ![a] = FALSE]
    /\ groundTruthDelivered'       = [groundTruthDelivered       EXCEPT ![a] = FALSE]
    /\ spawnedAtEvt'               = [spawnedAtEvt               EXCEPT ![a] = nextEvtId]
    /\ deadAtEvt'                  = [deadAtEvt                  EXCEPT ![a] = NULL]
    /\ pendingProtocolError'       = [pendingProtocolError       EXCEPT ![a] = FALSE]
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — -Resume lifecycle
\* =============================================================================

\* -Resume is NOT available after "user_rollback" (terminal semantic halt).
\* OBJ-2(v9): ~rollbackRequested guard — cannot resume a halted bus while rollback is
\* pending.  The pending rollback must be resolved (via RouterExecutesRollback or
\* RouterHaltsRollbackSqliteError) before -Resume is available.
UserResumes ==
    /\ busStatus = "halted"
    /\ haltReason \in {"mechanical_error", "user_interrupt"}
    /\ ~rollbackRequested
    /\ busStatus' = "resuming"
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

RouterResumesAgent(a) ==
    /\ BusResuming
    /\ agentStatus[a] = "dead"
    /\ ~checkpointStored[a]
    /\ agentStatus'          = [agentStatus          EXCEPT ![a] = "spawning"]
    /\ agentWorktree'        = [agentWorktree        EXCEPT ![a] = NULL]
    /\ spawnedAtEvt'         = [spawnedAtEvt         EXCEPT ![a] = nextEvtId]
    /\ deadAtEvt'            = [deadAtEvt            EXCEPT ![a] = NULL]
    /\ groundTruthDelivered' = [groundTruthDelivered EXCEPT ![a] = FALSE]
    /\ pendingProtocolError' = [pendingProtocolError EXCEPT ![a] = FALSE]
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            checkpointStored, checkpointResponseInFlight,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

BusResumed ==
    /\ BusResuming
    /\ \A a \in Agents : agentStatus[a] /= "dead"
    /\ busStatus' = "running"
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — Protocol error (non-terminal recovery)
\* =============================================================================

RouterEmitsProtocolError(a) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ groundTruthDelivered[a]
    /\ ~pendingProtocolError[a]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent("router", a, "protocol_error", NULL, NULL)
    /\ pendingProtocolError' = [pendingProtocolError EXCEPT ![a] = TRUE]
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

AgentEmitsAfterProtocolError(a) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ pendingProtocolError[a]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, "router", "protocol_error_ack", NULL, NULL)
    /\ pendingProtocolError' = [pendingProtocolError EXCEPT ![a] = FALSE]
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — Objections and consensus
\* =============================================================================

AgentRaisesObjection(a) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ nextEvtId <= MaxEvtId
    /\ consensusState = "open"
    /\ AppendEvent(a, "router", "objection", NULL, NULL)
    /\ unresolvedObjections' = unresolvedObjections \cup {nextEvtId}
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

AgentResolvesObjection(a, objEvtId) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ objEvtId \in unresolvedObjections
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, "router", "objection_response", objEvtId, NULL)
    /\ unresolvedObjections' = unresolvedObjections \ {objEvtId}
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

ModeratorOverridesObjection(a, objEvtId) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ objEvtId \in unresolvedObjections
    /\ objEvtId \notin overriddenObjections
    /\ consensusState = "candidate"
    /\ overriddenObjections' = overriddenObjections \cup {objEvtId}
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* OBJ-1(v8): Two consensus-safety guards added.
\*   (a) groundTruthDelivered[a]: the proposing moderator must have received context.
\*   (b) OBJ-A(v10) epoch-scoped: at least one objection in the CURRENT round.
\*       '\E e \in eventLog : e.type = "objection" /\ e.evt_id >= consensusRoundStart'
\*       Scoping to the current round prevents pre-rollback objections in the immutable
\*       eventLog from satisfying this guard after a rollback reset (OBJ-A(v10)).
\*       Also blocks the trivial zero-debate ratification path (OBJ-1(v8) intent).
\*
\* OBJ-10(v9) / OBJ-B(v10): Ground-truth guard extended to all objecting agents in
\*   the CURRENT consensus round.
\*   (c) '\A e \in eventLog :
\*           (e.type = "objection" /\ e.from \in Agents /\ e.evt_id >= consensusRoundStart)
\*               => groundTruthDelivered[e.from]'
\*       OBJ-B(v10): Scoped to consensusRoundStart so that pre-rollback objectors whose
\*       agents were respawned (groundTruthDelivered reset to FALSE by RouterRespawnsAgent)
\*       do not block the fresh post-rollback consensus round.  The from \in Agents filter
\*       is defensive (TypeSenderACL already requires it).
ModeratorEmitsCandidate(a) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ groundTruthDelivered[a]
    /\ consensusState = "open"
    /\ \E e \in eventLog : e.type = "objection" /\ e.evt_id >= consensusRoundStart
    /\ \A e \in eventLog :
           (e.type = "objection" /\ e.from \in Agents /\ e.evt_id >= consensusRoundStart)
               => groundTruthDelivered[e.from]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, "router", "consensus_candidate", NULL, NULL)
    /\ consensusState' = "candidate"
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

RouterRatifiesConsensus ==
    /\ BusRunning
    /\ consensusState = "candidate"
    /\ (unresolvedObjections \ overriddenObjections) = {}
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent("router", "broadcast", "consensus_ratified", NULL, NULL)
    /\ consensusState'   = "ratified"
    /\ busStatus'        = "halted"
    /\ haltReason'       = "consensus_ratified"
    /\ failureCategory'  = NULL
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

RouterFailsConsensus ==
    /\ BusRunning
    /\ consensusState = "candidate"
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent("router", "broadcast", "consensus_failed", NULL, NULL)
    /\ consensusState'   = "failed"
    /\ busStatus'        = "halted"
    /\ haltReason'       = "consensus_failed"
    /\ failureCategory'  = NULL
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — Handler anti-corruption boundary (HandlerAdapter)
\* =============================================================================

\* OBJ-9(v9): Records spawnedAtEvt[a] as the handler's epoch at receive time.
\* HandlerAdapterCompletes will verify the epoch still matches, blocking completions
\* from a different agent lifetime.
HandlerAdapterReceives(a, h) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ h \in Handlers
    /\ handlerState[h] = "idle"
    /\ groundTruthDelivered[a]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, h, "verify", NULL, NULL)
    /\ handlerState'        = [handlerState        EXCEPT ![h] = "busy"]
    /\ handlerPendingEvt'   = [handlerPendingEvt   EXCEPT ![h] = nextEvtId]
    /\ handlerPendingAgent' = [handlerPendingAgent EXCEPT ![h] = a]
    /\ handlerPendingEpoch' = [handlerPendingEpoch EXCEPT ![h] = spawnedAtEvt[a]]
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState, consensusRoundStart,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError, pipeline_lock,
            snapshotExists, rollbackRequested, rollbackTargetWorktree >>

\* OBJ-9(v9): Epoch guard: spawnedAtEvt[a] = handlerPendingEpoch[h] ensures this
\* completion corresponds to the same agent lifetime that initiated the call.
\* If the agent crashed and was respawned between receive and complete, AgentCrashes
\* already cleared handlerPendingAgent[h] (so a = NULL and a /= NULL fails), making
\* this epoch check belt-and-suspenders for checkpoint-based respawn paths.
HandlerAdapterCompletes(h) ==
    LET a         == handlerPendingAgent[h]
        inReplyTo == handlerPendingEvt[h]
    IN
    /\ BusRunning
    /\ h \in Handlers
    /\ handlerState[h] = "busy"
    /\ a /= NULL
    /\ inReplyTo /= NULL
    /\ AgentAlive(a)
    /\ groundTruthDelivered[a]
    /\ spawnedAtEvt[a] = handlerPendingEpoch[h]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(h, a, "verify_result", inReplyTo, NULL)
    /\ handlerState'        = [handlerState        EXCEPT ![h] = "idle"]
    /\ handlerPendingEvt'   = [handlerPendingEvt   EXCEPT ![h] = NULL]
    /\ handlerPendingAgent' = [handlerPendingAgent EXCEPT ![h] = NULL]
    /\ handlerPendingEpoch' = [handlerPendingEpoch EXCEPT ![h] = NULL]
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState, consensusRoundStart,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError, pipeline_lock,
            snapshotExists, rollbackRequested, rollbackTargetWorktree >>

\* OBJ-3(v8): WF_vars(HandlerFails(h)) in Fairness as belt-and-suspenders.
\* OBJ-9(v9): Also clears handlerPendingEpoch.
HandlerFails(h) ==
    /\ BusRunning
    /\ h \in Handlers
    /\ handlerState[h] = "busy"
    /\ handlerState'        = [handlerState        EXCEPT ![h] = "idle"]
    /\ handlerPendingEvt'   = [handlerPendingEvt   EXCEPT ![h] = NULL]
    /\ handlerPendingAgent' = [handlerPendingAgent EXCEPT ![h] = NULL]
    /\ handlerPendingEpoch' = [handlerPendingEpoch EXCEPT ![h] = NULL]
    /\ busStatus'           = "halted"
    /\ haltReason'          = "mechanical_error"
    /\ failureCategory'     = "handler_failure"
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState, consensusRoundStart,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError, pipeline_lock,
            snapshotExists, rollbackRequested, rollbackTargetWorktree >>

\* =============================================================================
\* ACTIONS — Review
\* =============================================================================

AgentRequestsReview(a, reviewer) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ AgentAlive(reviewer)
    /\ a /= reviewer
    /\ groundTruthDelivered[a]
    /\ groundTruthDelivered[reviewer]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, reviewer, "review_requested", NULL, NULL)
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

ReviewerEmitsVerdict(reviewer, a, inReplyTo) ==
    /\ BusRunning
    /\ AgentAlive(reviewer)
    /\ AgentAlive(a)
    /\ groundTruthDelivered[reviewer]
    /\ groundTruthDelivered[a]
    /\ inReplyTo \in routedIds
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(reviewer, a, "review_verdict", inReplyTo, NULL)
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — Group aggregate
\* =============================================================================

RouterAddsAgentToGroup(a, g) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ a \notin groupMembers[g]
    /\ groupMembers' = [groupMembers EXCEPT ![g] = groupMembers[g] \cup {a}]
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

AgentSendsToGroup(a, g) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ a \in groupMembers[g]
    /\ a \notin groupReplies[g]
    /\ nextEvtId <= MaxEvtId
    /\ AppendEvent(a, "broadcast", "review_requested", NULL, g)
    /\ groupReplies' = [groupReplies EXCEPT ![g] = groupReplies[g] \cup {a}]
    /\ UNCHANGED <<
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

NonMemberSendsToGroup(a, g) ==
    /\ BusRunning
    /\ AgentAlive(a)
    /\ a \notin groupMembers[g]
    /\ groupMembers[g] /= {}
    /\ groupViolationPending' = TRUE
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — Halt conditions
\* =============================================================================

RouterHaltsFeatureComplete ==
    /\ BusRunning
    /\ committedDoneEvts /= {}
    /\ busStatus'       = "halted"
    /\ haltReason'      = "feature_complete"
    /\ failureCategory' = NULL
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

RouterHaltsDuplicateId ==
    /\ BusRunning
    /\ nextEvtId \in routedIds
    /\ busStatus'       = "halted"
    /\ haltReason'      = "mechanical_error"
    /\ failureCategory' = "duplicate_evt_id"
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

RouterHaltsGroupViolation ==
    /\ BusRunning
    /\ groupViolationPending
    /\ busStatus'             = "halted"
    /\ haltReason'            = "mechanical_error"
    /\ failureCategory'       = "group_violation"
    /\ groupViolationPending' = FALSE
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* OBJ-8(v8): UserInterrupts intentionally has NO fairness — it models an out-of-band
\* Ctrl+C signal that the specification cannot compel.
UserInterrupts ==
    /\ BusRunning
    /\ busStatus'       = "halted"
    /\ haltReason'      = "user_interrupt"
    /\ failureCategory' = NULL
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* OBJ-4(v8) / OBJ-12(v8): TERMINAL PATH.
\* WF suffices because nextEvtId > MaxEvtId is a monotone property once true.
\* Doc gap (b, v11): This action is structurally identical at MaxEvtId = 4 (model) and
\* MaxEvtId = Int64.MaxValue (production, 9,223,372,036,854,775,807).  The overflow halt
\* is a real protocol path; the trigger threshold is a model parameter (CONSTANTS in .cfg),
\* not a protocol invariant.  RouterHaltsBoundReached fires in both cases when
\* nextEvtId > MaxEvtId; only the state-space size differs.
RouterHaltsBoundReached ==
    /\ BusRunning
    /\ nextEvtId > MaxEvtId
    /\ busStatus'       = "halted"
    /\ haltReason'      = "mechanical_error"
    /\ failureCategory' = "evt_id_overflow"
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* OBJ-2(v8): SQLite error halt.  Guard narrowed to {"spawning","checkpointing","renewing"}.
\* These are the three states where SQLite agent_sessions writes occur.
\* OBJ-11(v9): SQLite errors during rollback execution are covered by the separate
\* RouterHaltsRollbackSqliteError action.
RouterHaltsSqliteError ==
    /\ BusRunning
    /\ \E a \in Agents : agentStatus[a] \in {"spawning", "checkpointing", "renewing"}
    /\ busStatus'       = "halted"
    /\ haltReason'      = "mechanical_error"
    /\ failureCategory' = "sqlite_error"
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, rollbackRequested, rollbackTargetWorktree,
            consensusRoundStart >>

\* =============================================================================
\* ACTIONS — Pipeline mutex
\* =============================================================================
\*
\* OBJ-10(v8): "user_rollback" added to the semantic-halt set.
\* OBJ-8(v8): WF_vars(ReleasePipelineLock) added to Fairness.

ReleasePipelineLock ==
    /\ busStatus = "halted"
    /\ haltReason \in {"consensus_ratified", "consensus_failed",
                        "feature_complete",   "user_rollback"}
    /\ pipeline_lock = TRUE
    /\ pipeline_lock' = FALSE
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState, consensusRoundStart,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            snapshotExists, rollbackRequested, rollbackTargetWorktree >>

\* =============================================================================
\* ACTIONS — /rollback
\* =============================================================================
\*
\* OBJ-10(v8): Three-action rollback protocol:
\*   RouterTakesSnapshot(w)  — captures git snapshot before first commit.
\*   UserRequestsRollback(w) — parameterized CLI signal; records target worktree.
\*   RouterExecutesRollback  — drains, resets, halts.
\*
\* OBJ-11(v9): RouterHaltsRollbackSqliteError — SQLite failure during rollback.

\* OBJ-3(v9): ~rollbackRequested guard — no new snapshot while rollback is in flight.
\* OBJ-13(v9): WF_vars(RouterTakesSnapshot(w)) in Fairness ensures snapshot is
\* eventually taken, preventing RollbackEventuallyCompletes from vacuously holding.
RouterTakesSnapshot(w) ==
    /\ BusRunning
    /\ ~snapshotExists[w]
    /\ ~rollbackRequested
    /\ snapshotExists' = [snapshotExists EXCEPT ![w] = TRUE]
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState, consensusRoundStart,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, rollbackRequested, rollbackTargetWorktree >>

\* OBJ-4(v9): Parameterized with worktree w.  Sets rollbackTargetWorktree = w so that
\* RouterExecutesRollback and RollbackRequiresSnapshot can verify the target-specific
\* snapshot exists.  Cross-worktree rollback (snapshot on wt1, rollback targets wt2)
\* is unreachable because the guard snapshotExists[w] is scoped to the same w.
\*
\* OBJ-12(v9): WF_vars(UserRequestsRollback(w)) in Fairness — prevents scheduler
\* starvation.  See Fairness section for discussion.
\*
\* OBJ-LOW-2(v12): "halted" removed from busStatus guard.
\* Previously the action accepted busStatus = "halted" to model a user issuing /rollback
\* immediately after a halt.  This created a WF loop: after RouterAbortsStaleRollback
\* cleared rollbackRequested, UserRequestsRollback was re-enabled (snapshot preserved,
\* busStatus still "halted"), and RouterAbortsStaleRollback was immediately re-enabled —
\* a cycle WF compelled indefinitely, deferring UserResumes.  The user must now -Resume
\* before issuing /rollback.  RouterAbortsStaleRollback still handles the case where
\* Ctrl+C fires while a rollback is already in flight (case 1 of OBJ-C(v10)).
UserRequestsRollback(w) ==
    /\ busStatus \in {"running", "resuming"}
    /\ ~rollbackRequested
    /\ snapshotExists[w]
    /\ rollbackRequested'       = TRUE
    /\ rollbackTargetWorktree'  = w
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, consensusRoundStart >>

\* OBJ-1(v9): BusRunning guard — rollback must not fire while bus is already halted.
\* OBJ-8(v9): Commit-drain guard — all worktree locks must be released first.
\* OBJ-7(v9): Resets consensusState, unresolvedObjections, overriddenObjections.
\* OBJ-4(v9): Uses rollbackTargetWorktree; only clears target snapshot (not all).
\*            rollbackTargetWorktree' = NULL after completion.
\* OBJ-A(v10): Sets consensusRoundStart' = nextEvtId so that ModeratorEmitsCandidate's
\*             epoch-scoped guards cannot be satisfied by pre-rollback events in eventLog.
\* eventLog is NOT rolled back — events are immutable records of history.
RouterExecutesRollback ==
    /\ BusRunning
    /\ rollbackRequested
    /\ rollbackTargetWorktree /= NULL
    /\ snapshotExists[rollbackTargetWorktree]
    /\ \A w \in Worktrees : commitLockHolder[w] = NULL
    /\ busStatus'              = "halted"
    /\ haltReason'             = "user_rollback"
    /\ failureCategory'        = NULL
    /\ rollbackRequested'      = FALSE
    /\ rollbackTargetWorktree' = NULL
    /\ committedDoneEvts'      = {}
    /\ commitLockHolder'       = [w \in Worktrees |-> NULL]
    /\ pendingDoneEvt'         = [w \in Worktrees |-> NULL]
    /\ snapshotExists'         = [snapshotExists EXCEPT ![rollbackTargetWorktree] = FALSE]
    /\ consensusState'         = "open"
    /\ unresolvedObjections'   = {}
    /\ overriddenObjections'   = {}
    /\ consensusRoundStart'    = nextEvtId
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock >>

\* OBJ-11(v9): SQLite error during rollback execution.
\*   RouterHaltsSqliteError covers SQLite errors during agent-session writes (spawning,
\*   checkpointing, renewing).  Rollback involves separate SQLite operations (clearing
\*   bus_snapshots, updating committed-state tables) not covered by agent states.
\*   This action handles that gap.  rollbackRequested and rollbackTargetWorktree are
\*   cleared so that after -Resume the user may issue a fresh /rollback request.
\*
\* OBJ-EC-2(v10): Commit-drain guard added.
\*   '\A w \in Worktrees : commitLockHolder[w] = NULL' added, parallel with OBJ-8(v9)'s
\*   RouterExecutesRollback guard.  Without this, halting while a commit is in flight
\*   leaves commitLockHolder non-NULL and silently drops the in-flight commit — exactly
\*   the pattern OBJ-8 meant to close.  SF on RouterCommitSucceeds guarantees drain.
\*
\* OBJ-EC-3(v10): Resets consensusState = "open", unresolvedObjections = {},
\*   overriddenObjections = {}.  Symmetric with OBJ-7(v9)'s clean-slate principle in
\*   RouterExecutesRollback.  The failure path is also a clean slate: between SQLite
\*   error and retry-after-Resume, consensus machinery must not carry pre-halt state.
\*
\* OBJ-A(v10): Sets consensusRoundStart' = nextEvtId (coupled with OBJ-EC-3 reset).
\*   Post-rollback ModeratorEmitsCandidate guards cannot be satisfied by pre-rollback
\*   events in the immutable eventLog.
\*
\* OBJ-D(v10): Always-enabled nondeterminism note.
\*   This action has no "SQLite operation in progress" flag — after the commit drain,
\*   it is enabled whenever BusRunning /\ rollbackRequested.  TLC explores the SQLite
\*   failure path from every pre-rollback, post-drain state.  This is deliberate
\*   nondeterministic fault injection: the spec proves safety and liveness hold
\*   regardless of whether SQLite succeeds or fails during rollback execution.
RouterHaltsRollbackSqliteError ==
    /\ BusRunning
    /\ rollbackRequested
    /\ \A w \in Worktrees : commitLockHolder[w] = NULL
    /\ busStatus'              = "halted"
    /\ haltReason'             = "mechanical_error"
    /\ failureCategory'        = "sqlite_error"
    /\ rollbackRequested'      = FALSE
    /\ rollbackTargetWorktree' = NULL
    /\ consensusState'         = "open"
    /\ unresolvedObjections'   = {}
    /\ overriddenObjections'   = {}
    /\ consensusRoundStart'    = nextEvtId
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists >>

\* OBJ-C(v10) / OBJ-E(v10): Abort a stale rollback when the bus is halted and the
\* rollback cannot execute.  One structural entry path remains after OBJ-LOW-2(v12):
\*   1. Ctrl+C during rollback wait: UserInterrupts fires while rollbackRequested = TRUE.
\*      Bus halts with haltReason = "user_interrupt".  UserResumes is blocked by
\*      ~rollbackRequested.  RouterExecutesRollback requires BusRunning (cannot be
\*      re-entered without Resume).  Without this action, rollbackRequested persists
\*      forever — unrecoverable state for the rollback subsystem.
\*   (OBJ-E case 2 — halted-state /rollback — is no longer reachable after OBJ-LOW-2(v12)
\*    removed "halted" from UserRequestsRollback's busStatus guard.)
\* Fix: when busStatus = "halted" /\ rollbackRequested, abort the pending rollback.
\*
\* OBJ-LOW-3(v12): Commit-drain guard intentionally absent.
\*   RouterExecutesRollback and RouterHaltsRollbackSqliteError require
\*   '\A w : commitLockHolder[w] = NULL'.  This action does NOT require it because:
\*   abort performs no SQLite or commit work and does not touch commitLockHolder.
\*   If Ctrl+C fired while a commit was in flight, the commit resolves independently
\*   via RouterCommitSucceeds / RouterCommitFails.  CommitLockHolderAliveOrBusHalted
\*   (invariant 5) covers the resulting state: bus is halted, satisfying the
\*   "busStatus /= running" disjunct even with a non-NULL lock holder.
\*
\* OBJ-LOW-4(v12): rollbackTargetWorktree-NULL precondition and RollbackRequiresSnapshot.
\*   RollbackRequiresSnapshot (invariant 20) asserts:
\*     rollbackRequested => rollbackTargetWorktree /= NULL /\ snapshotExists[rollbackTargetWorktree]
\*   This action fires only when rollbackRequested = TRUE, so the invariant guarantees
\*   rollbackTargetWorktree /= NULL before the abort fires.  The assignment
\*   rollbackTargetWorktree' = NULL is therefore never a no-op in a reachable state.
\*   After abort, rollbackRequested' = FALSE makes RollbackRequiresSnapshot's antecedent
\*   vacuously false — the invariant is trivially satisfied.  snapshotExists is preserved
\*   so the user may re-issue /rollback after -Resume.
\*
\* The snapshot (snapshotExists[w]) is preserved so the user may re-issue /rollback
\* after -Resume.  consensusRoundStart is NOT advanced — the rollback did not execute,
\* so no clean-slate epoch boundary occurred; the existing consensus round continues.
\* WF_vars(RouterAbortsStaleRollback) in Fairness ensures eventual abort.
RouterAbortsStaleRollback ==
    /\ busStatus = "halted"
    /\ rollbackRequested
    /\ rollbackRequested'      = FALSE
    /\ rollbackTargetWorktree' = NULL
    /\ UNCHANGED <<
            nextEvtId, eventLog, routedIds,
            agentStatus, agentWorktree,
            checkpointStored, checkpointResponseInFlight, groundTruthDelivered,
            spawnedAtEvt, deadAtEvt,
            unresolvedObjections, overriddenObjections, consensusState,
            commitLockHolder, committedDoneEvts, pendingDoneEvt,
            busStatus, haltReason, failureCategory,
            groupMembers, groupReplies, groupViolationPending,
            pendingProtocolError,
            handlerState, handlerPendingEvt, handlerPendingAgent, handlerPendingEpoch,
            pipeline_lock, snapshotExists, consensusRoundStart >>

\* =============================================================================
\* NEXT
\* =============================================================================

Next ==
    \/ \E a \in Agents :
        \/ \E w \in Worktrees  : DeliverBootstrap(a, w)
        \/ DeliverGroundTruth(a)
        \/ \E w \in Worktrees  : AgentSendsDone(a, w)
        \/ AgentCrashes(a)
        \/ RouterInitiatesCheckpoint(a)
        \/ AgentCheckpointResponse(a)
        \/ RouterRespawnsAgent(a)
        \/ RouterResumesAgent(a)
        \/ RouterEmitsProtocolError(a)
        \/ AgentEmitsAfterProtocolError(a)
        \/ AgentRaisesObjection(a)
        \/ \E obj \in unresolvedObjections : AgentResolvesObjection(a, obj)
        \/ \E obj \in unresolvedObjections : ModeratorOverridesObjection(a, obj)
        \/ ModeratorEmitsCandidate(a)
        \/ \E h \in Handlers   : HandlerAdapterReceives(a, h)
        \/ \E r \in Agents     : AgentRequestsReview(a, r)
        \/ \E r \in Agents     : \E id \in routedIds : ReviewerEmitsVerdict(a, r, id)
        \/ \E g \in GroupIds   : RouterAddsAgentToGroup(a, g)
        \/ \E g \in GroupIds   : AgentSendsToGroup(a, g)
        \/ \E g \in GroupIds   : NonMemberSendsToGroup(a, g)
    \/ \E w \in Worktrees : RouterCommitSucceeds(w)
    \/ \E w \in Worktrees : RouterCommitFails(w)
    \/ \E w \in Worktrees : RouterTakesSnapshot(w)
    \/ \E w \in Worktrees : UserRequestsRollback(w)
    \/ RouterRatifiesConsensus
    \/ RouterFailsConsensus
    \/ \E h \in Handlers :
        \/ HandlerAdapterCompletes(h)
        \/ HandlerFails(h)
    \/ RouterHaltsFeatureComplete
    \/ RouterHaltsDuplicateId
    \/ RouterHaltsGroupViolation
    \/ UserInterrupts
    \/ RouterHaltsBoundReached
    \/ RouterHaltsSqliteError
    \/ RouterHaltsRollbackSqliteError
    \/ RouterAbortsStaleRollback
    \/ UserResumes
    \/ BusResumed
    \/ ReleasePipelineLock
    \/ RouterExecutesRollback

\* =============================================================================
\* FAIRNESS
\* =============================================================================
\*
\* SF: contended resource — prevents starvation under adversarial scheduling.
\* WF: non-contended / monotone-enabled — sufficient when no competition exists.
\*
\* No fairness: UserInterrupts (Ctrl+C), UserResumes (-Resume) — out-of-band CLI
\* signals the specification cannot compel.
\*
\* OBJ-3(v8): WF(HandlerFails) — belt-and-suspenders for stuck-busy handler.
\* OBJ-8(v8): WF(ReleasePipelineLock) — was previously orphaned.
\* OBJ-10(v8): WF(RouterExecutesRollback) — ensures rollback completes once requested.
\* OBJ-12(v9): WF(UserRequestsRollback(w)) — prevents scheduler starvation of the
\*   rollback request signal.  Compels eventual /rollback when snapshot exists.
\*   Note: this is stronger than the "out-of-band" framing for UserInterrupts; it
\*   reflects that the vibe-cli pipeline design guarantees /rollback is always
\*   eventually exercised when conditions are met (unlike the ad-hoc Ctrl+C path).
\* OBJ-13(v9): WF(RouterTakesSnapshot(w)) — ensures snapshots are eventually taken,
\*   preventing RollbackEventuallyCompletes from holding vacuously.
\* OBJ-C(v10): WF(RouterAbortsStaleRollback) — ensures stale rollback is cleared when
\*   bus is halted and rollbackRequested persists.  Both guard conditions are stable
\*   once set (bus stays halted until resume; rollbackRequested persists until cleared),
\*   so WF suffices: once continuously enabled, the action must eventually fire.

Fairness ==
    \* HOT PATH — SF: releases a held commit lock contested by multiple agents.
    /\ \A w \in Worktrees : SF_vars(RouterCommitSucceeds(w))

    \* HOT PATH — WF: spawning agent eventually gets bootstrap.
    /\ \A a \in Agents : \A w \in Worktrees : WF_vars(DeliverBootstrap(a, w))

    \* HOT PATH — WF: consensus candidate eventually resolves.
    /\ WF_vars(RouterRatifiesConsensus)
    /\ WF_vars(RouterFailsConsensus)

    \* HOT PATH — WF: AgentSendsDone acquires lock only when free (no contention).
    /\ \A a \in Agents : \A w \in Worktrees : WF_vars(AgentSendsDone(a, w))

    \* RECOVERY PATH — WF: dead agents eventually re-queued during resuming.
    /\ \A a \in Agents : WF_vars(RouterResumesAgent(a))

    \* RECOVERY PATH — WF: agent eventually corrects after protocol_error.
    \*   Note: WF not satisfiable when nextEvtId > MaxEvtId (ack cannot append).
    \*   RouterHaltsBoundReached (WF, TERMINAL PATH below) discharges the liveness
    \*   property via the "busStatus = halted" disjunct in that corner case.
    /\ \A a \in Agents : WF_vars(AgentEmitsAfterProtocolError(a))

    \* RECOVERY PATH — WF: bus eventually re-enters running once all agents re-queued.
    /\ WF_vars(BusResumed)

    \* RECOVERY PATH — WF (OBJ-3(v8)): handler eventually fails if stuck-busy and
    \* HandlerAdapterCompletes is permanently disabled.
    /\ \A h \in Handlers : WF_vars(HandlerFails(h))

    \* TERMINAL PATH — WF: evt_id exhaustion eventually halts (monotone condition).
    /\ WF_vars(RouterHaltsBoundReached)

    \* TERMINAL PATH — WF (OBJ-8(v8)): lock eventually released after semantic terminal halt.
    /\ WF_vars(ReleasePipelineLock)

    \* TERMINAL PATH — WF (OBJ-10(v8)): rollback eventually executes once requested.
    /\ WF_vars(RouterExecutesRollback)

    \* SNAPSHOT PATH — WF (OBJ-13(v9)): snapshot eventually taken for each worktree.
    /\ \A w \in Worktrees : WF_vars(RouterTakesSnapshot(w))

    \* ROLLBACK PATH — WF (OBJ-12(v9)): rollback eventually requested when conditions met.
    /\ \A w \in Worktrees : WF_vars(UserRequestsRollback(w))

    \* ABORT PATH — WF (OBJ-C(v10)): stale rollback eventually aborted when bus is halted.
    /\ WF_vars(RouterAbortsStaleRollback)

\* =============================================================================
\* SPEC
\* =============================================================================
\*
\* OBJ-11(v8) / Clock scope-out: No Tick/clock variable introduced.
\* BDD references NTP skew and DST transitions.  Heartbeat timing and latency SLOs
\* are implementation-level concerns tracked by the PowerShell heartbeat runspace,
\* not protocol-level constraints.  This omission is intentional and explicit.

Spec == Init /\ [][Next]_vars /\ Fairness

\* =============================================================================
\* SAFETY PROPERTIES (invariants)
\* =============================================================================

\* 1. No two records in eventLog share an evt_id.
NoDuplicateEvtId ==
    \A e1 \in eventLog : \A e2 \in eventLog :
        (e1 /= e2) => (e1.evt_id /= e2.evt_id)

\* 2. No event was delivered to an agent after it died or entered renewing.
DeadAgentReceivesNoMessages ==
    \A e \in eventLog :
        \A a \in Agents :
            e.to = a =>
                \/ deadAtEvt[a] = NULL
                \/ e.evt_id < deadAtEvt[a]
                \/ e.type = "bootstrap"

\* 3. Consensus ratified only when (unresolvedObjections \ overriddenObjections) = {}.
RatificationRequiresNoUnoverriddenObjections ==
    consensusState = "ratified" =>
        (unresolvedObjections \ overriddenObjections) = {}

\* 4. Only the defined halt reasons ever terminate the bus.
OnlyDefinedHalts ==
    busStatus = "halted" => haltReason \in HaltReasons

\* 5. Commit lock holder is alive or the bus has stopped.
CommitLockHolderAliveOrBusHalted ==
    \A w \in Worktrees :
        commitLockHolder[w] /= NULL =>
            (agentStatus[commitLockHolder[w]] = "alive" \/ busStatus /= "running")

\* 6. evt_id strictly increases.
EvtIdMonotone ==
    \A e \in eventLog : e.evt_id < nextEvtId

\* 7. A spawning agent only receives bootstrap events in its current lifetime.
SpawningAgentOnlyReceivesBootstrap ==
    \A e \in eventLog :
        \A a \in Agents :
            (e.to = a /\ agentStatus[a] = "spawning") =>
                \/ e.evt_id < spawnedAtEvt[a]
                \/ e.type = "bootstrap"

\* 8. Exactly one bootstrap per lifetime epoch.
ExactlyOneBootstrapPerLifetime ==
    \A a \in Agents :
        LET boots == {e \in eventLog :
                         e.to = a /\ e.type = "bootstrap" /\ e.evt_id >= spawnedAtEvt[a]}
        IN  /\ Cardinality(boots) <= 1
            /\ agentStatus[a] \in {"alive", "checkpointing"} =>
                   Cardinality(boots) = 1

\* 9. Every non-bootstrap, non-ground_truth event TO an alive agent is preceded
\*    by a ground_truth event in the same lifetime.
GroundTruthPrecedesAgentMessage ==
    \A e \in eventLog :
        \A a \in Agents :
            (   e.to = a
             /\ e.type \notin {"bootstrap", "ground_truth"}
             /\ e.evt_id >= spawnedAtEvt[a]
            ) =>
                \E gt \in eventLog :
                    /\ gt.to     = a
                    /\ gt.type   = "ground_truth"
                    /\ gt.evt_id < e.evt_id
                    /\ gt.evt_id >= spawnedAtEvt[a]

\* 10. Overridden objections are a subset of known-routed objections.
OverrideIntegrity ==
    overriddenObjections \subseteq routedIds

\* 11. Commit idempotency: the done evt_id currently pending commit has not already
\*     been committed.
CommitIdempotency ==
    \A w \in Worktrees :
        pendingDoneEvt[w] /= NULL =>
            pendingDoneEvt[w] \notin committedDoneEvts

\* 12. Every agent in groupReplies[g] has a matching event record with groupId = g.
AllGroupRepliesHaveSentEvents ==
    \A g \in GroupIds :
        \A a \in Agents :
            a \in groupReplies[g] =>
                \E e \in eventLog :
                    /\ e.from    = a
                    /\ e.groupId = g

\* 13. The bus only runs (or resumes) while the pipeline lock is held.
BusRunningImpliesLockHeld ==
    busStatus \in {"running", "resuming"} => pipeline_lock = TRUE

\* 14. Consensus events are never addressed to native handlers.
ConsensusEventsRoutedThroughBus ==
    \A e \in eventLog :
        e.type \in ConsensusEventTypes =>
            /\ e.to   \notin Handlers
            /\ e.from \notin Handlers

\* 15. OBJ-5(v8) / OBJ-15(v9): MechanicalHaltHasCategory — bidirectional.
\*     v8: haltReason = "mechanical_error" => failureCategory in set.
\*     v9: also haltReason /= "mechanical_error" => failureCategory = NULL.
\*     This prevents semantic halts (feature_complete, consensus_ratified, etc.)
\*     from carrying spurious failureCategory values.
\*     ExitCodeTotality proof obligation (by inspection of ExitCodeOf):
\*       \A cat \in FailureCategories : ExitCodeOf(cat) /= 0  — trivially true.
MechanicalHaltHasCategory ==
    busStatus = "halted" =>
        /\ (haltReason = "mechanical_error" => failureCategory \in FailureCategories)
        /\ (haltReason /= "mechanical_error" => failureCategory = NULL)

\* 16. OBJ-10(v7): Pending protocol error implies agent is alive (and bus running).
PendingProtocolErrorImpliesAgentAlive ==
    BusRunning =>
        \A a \in Agents :
            pendingProtocolError[a] = TRUE => AgentAlive(a)

\* 17. OBJ-6(v8) / OBJ-A(v10): CandidateHasEventInLog — scoped to the current
\*     consensus round (epoch >= consensusRoundStart).
\*     Proof obligation (by construction): consensusState = "ratified" =>
\*       \E e \in eventLog : e.type = "consensus_ratified" /\ e.from = "router".
\*     (RouterRatifiesConsensus unconditionally appends this event; vacuous in TLC.)
\*
\*     CandidateHasEventInLog is non-tautological: verifies that ModeratorEmitsCandidate
\*     actually appended a consensus_candidate event in the CURRENT round before
\*     consensusState advanced past "open".
\*     OBJ-A(v10): the evt_id >= consensusRoundStart filter prevents a stale pre-rollback
\*     consensus_candidate (from before RouterExecutesRollback or RouterHaltsRollbackSqliteError
\*     advanced consensusRoundStart) from satisfying this invariant in the new round.
\*     After either rollback action, consensusState = "open" (OBJ-7(v9) / OBJ-EC-3(v10)),
\*     so the invariant is trivially satisfied post-rollback until a new candidate is emitted.
CandidateHasEventInLog ==
    consensusState \in {"candidate", "ratified", "failed"} =>
        \E e \in eventLog :
            /\ e.type = "consensus_candidate"
            /\ e.from \in Agents
            /\ e.evt_id >= consensusRoundStart

\* 18. OBJ-7(v8) / OBJ-5(v9): TypeSenderACL — type-to-sender AND type-to-recipient ACL.
\*     From-side (v8): enforces sender authorization.
\*     To-side (v9): enforces recipient constraints, closing the gap where 'bootstrap'
\*     events with non-Agent recipients remained unrejected at the invariant level.
TypeSenderACL ==
    \A e \in eventLog :
        \* From-side constraints (OBJ-7(v8))
        /\ (e.type \in {"bootstrap", "ground_truth", "checkpoint",
                         "protocol_error", "consensus_ratified", "consensus_failed"})
               => e.from = "router"
        /\ (e.type \in {"done", "objection", "objection_response",
                         "consensus_candidate", "checkpoint_response",
                         "protocol_error_ack", "review_requested",
                         "review_verdict", "verify"})
               => e.from \in Agents
        /\ e.type = "verify_result" => e.from \in Handlers
        \* To-side constraints (OBJ-5(v9))
        /\ (e.type \in {"bootstrap", "ground_truth", "checkpoint",
                         "protocol_error", "verify_result", "review_verdict"})
               => e.to \in Agents
        /\ (e.type \in {"done", "objection", "objection_response",
                         "consensus_candidate", "checkpoint_response",
                         "protocol_error_ack"})
               => e.to = "router"
        /\ (e.type \in {"consensus_ratified", "consensus_failed"})
               => e.to = "broadcast"
        /\ e.type = "verify" => e.to \in Handlers
        /\ e.type = "review_requested"
               => (e.to \in Agents \/ e.to = "broadcast")

\* 19. OBJ-9(v8) / OBJ-9(v9): Handler-state consistency.
\*     handlerPendingAgent, handlerPendingEvt, and handlerPendingEpoch must all
\*     agree with handlerState.
HandlerStateConsistency ==
    \A h \in Handlers :
        /\ (handlerPendingAgent[h] /= NULL) = (handlerState[h] = "busy")
        /\ (handlerPendingEvt[h]   /= NULL) = (handlerState[h] = "busy")
        /\ (handlerPendingEpoch[h] /= NULL) = (handlerState[h] = "busy")

\* 20. OBJ-10(v8) / OBJ-4(v9): Rollback requires a target-specific snapshot.
\*     v8: rollbackRequested => \E w : snapshotExists[w].
\*     v9: rollbackRequested => rollbackTargetWorktree /= NULL
\*                              /\ snapshotExists[rollbackTargetWorktree].
\*     This closes the cross-worktree rollback gap: a snapshot on wt1 cannot satisfy
\*     a rollback targeting wt2.
RollbackRequiresSnapshot ==
    rollbackRequested =>
        /\ rollbackTargetWorktree /= NULL
        /\ snapshotExists[rollbackTargetWorktree]

\* 21. v12 / OBJ-LOW-1: consensusRoundStart is monotone non-decreasing and bounded
\*     by the current event frontier.
\*
\*     At Init: consensusRoundStart = 1, nextEvtId = 1 → 1 ≤ 1 ✓
\*     At advance (RouterExecutesRollback / RouterHaltsRollbackSqliteError):
\*       consensusRoundStart' = nextEvtId (UNCHANGED nextEvtId in the same step)
\*       → consensusRoundStart' = nextEvtId ✓ (equal, so ≤)
\*     After any AppendEvent: nextEvtId grows by 1; consensusRoundStart unchanged
\*       → consensusRoundStart ≤ nextEvtId (prev) ≤ nextEvtId (new) ✓
\*     No other action modifies consensusRoundStart.
\*
\*     The invariant rules out a "future" epoch marker that no event has yet reached.
\*     TypeOK bounds consensusRoundStart ∈ 1..(MaxEvtId+1); this invariant adds the
\*     tighter dynamic bound relative to nextEvtId.
ConsensusRoundStartMonotone ==
    consensusRoundStart <= nextEvtId

\* 22. OBJ-6(v9): No orphaned handler references to dead agents.
\*     AgentCrashes atomically clears handlerPendingAgent[h] for affected handlers.
\*     This invariant verifies that guarantee is maintained across all state transitions.
NoOrphanedHandlerForDeadAgent ==
    \A a \in Agents : \A h \in Handlers :
        agentStatus[a] = "dead" => handlerPendingAgent[h] /= a

\* =============================================================================
\* SYMMETRY (safety-only runs; omitted from .cfg for liveness correctness)
\* =============================================================================

AgentSymmetry == Permutations(Agents)

\* =============================================================================
\* LIVENESS PROPERTIES (temporal)
\* =============================================================================

\* Every spawning agent eventually becomes alive OR the bus halts.
AgentsEventuallyAlive ==
    \A a \in Agents :
        agentStatus[a] = "spawning" ~>
            (agentStatus[a] = "alive" \/ busStatus = "halted")

\* A consensus candidate eventually resolves OR the bus halts.
CandidateEventuallyResolves ==
    consensusState = "candidate" ~>
        (consensusState \in {"ratified", "failed"} \/ busStatus = "halted")

\* A held commit lock is eventually released OR the bus halts.
CommitLockEventuallyReleased ==
    \A w \in Worktrees :
        commitLockHolder[w] /= NULL ~>
            (commitLockHolder[w] = NULL \/ busStatus = "halted")

\* A pending protocol error is eventually cleared OR the bus halts.
ProtocolErrorEventuallyResolved ==
    \A a \in Agents :
        pendingProtocolError[a] = TRUE ~>
            (pendingProtocolError[a] = FALSE \/ busStatus = "halted")

\* OBJ-10(v8): A requested rollback eventually completes (rollbackRequested clears) OR
\* the bus halts.  WF_vars(RouterExecutesRollback) and WF_vars(UserRequestsRollback(w))
\* together guarantee this is not vacuous.
\* OBJ-C(v10): The "rollbackRequested = FALSE" consequent is now also satisfied by
\* RouterAbortsStaleRollback (WF_vars in Fairness), which clears rollbackRequested when
\* the bus is halted and the rollback cannot execute.  Both the clean execution path
\* (RouterExecutesRollback, RouterHaltsRollbackSqliteError) and the abort path
\* (RouterAbortsStaleRollback) satisfy this property.
RollbackEventuallyCompletes ==
    rollbackRequested = TRUE ~>
        (rollbackRequested = FALSE \/ busStatus = "halted")

=============================================================================
