--------------------------- MODULE SqliteState ---------------------------
(* version: 1.0.0 *)
(**************************************************************************)
(* TLA+ specification for vibe-cli SQLite State Repository                *)
(*                                                                        *)
(* Models the lifecycle of pipeline execution with centralized SQLite      *)
(* state: session management, feature lifecycle, stage progression,       *)
(* pipeline locking, debate rounds, Stage 7 coding tiers, and merge       *)
(* results.                                                               *)
(*                                                                        *)
(* Derived from: docs/sqlite-state/elicitor.md (2026-04-12)              *)
(*               docs/sqlite-state/bdd.feature                           *)
(*                                                                        *)
(* NAMING BRIDGE — TLA+ VARIABLES ↔ BDD/DATABASE COLUMNS                 *)
(* The TLA+ variable names do NOT match the BDD column names 1:1.         *)
(* This is a deliberate naming inversion documented here to prevent        *)
(* false-cognate confusion when tracing between the two documents.        *)
(*                                                                        *)
(*   TLA+ Variable     BDD/DB Column              DB Table                *)
(*   ──────────────    ──────────────────────────  ───────────────         *)
(*   featureStatus     features.status             features                *)
(*   pipelineState     pipeline_state.pipeline_state  pipeline_state       *)
(*   activeFeature     session.active_feature      session                 *)
(*   lockHolder        pipeline_lock.feature_name  pipeline_lock           *)
(*   crashCount        pipeline_lock.crash_count   pipeline_lock           *)
(*   lastCompleted     stage_progress.stage (max)  stage_progress          *)
(*   debateRound       debate_state.round          debate_state            *)
(*   debateConsensus   debate_state.consensus_status  debate_state         *)
(*   tierStatus        tier_progress.status         tier_progress          *)
(*   tierTasksDone     COUNT(task_results) per tier task_results           *)
(*   gateVerdict       gate_results.status          gate_results           *)
(*   mergeStatus       merge_results.status         merge_results          *)
(*                     NOTE (T4 — Rev 13): TLA+ mergeStatus is per-TIER;  *)
(*                     BDD merge_results is per-TASK_ID.  The TLA+ spec   *)
(*                     aggregates per-tier what the BDD tracks per-task.   *)
(*                     See MERGE ABSTRACTION section below for rationale.  *)
(*   dbOpen            (runtime: connection state)  —                      *)
(*                                                                        *)
(* The key false cognate: "featureStatus" sounds like it might map to the  *)
(* pipeline_state table, but it maps to the features table.  Conversely,  *)
(* "pipelineState" maps to pipeline_state.pipeline_state, not features.   *)
(* These two variables carry overlapping domains (running/halted/complete) *)
(* because they model denormalized columns in separate database tables.    *)
(* Invariants S5, S17, S18, S19, and S23 enforce their synchronization.   *)
(*                                                                        *)
(* Revision 13: Addresses 6 debate objections (fifth round):               *)
(*   T3: S20 equivalent non-ENABLED formulation was a tautology —          *)
(*        crashCount[f] >= MaxCrashes makes crashCount[f] < MaxCrashes    *)
(*        in the consequent always FALSE, so the implication is vacuously  *)
(*        TRUE regardless of dbOpen and lockHolder.  FIX: replaced the    *)
(*        tautological formulation with a corrected explanation that no    *)
(*        simpler non-ENABLED equivalent exists — the crash budget guard   *)
(*        IS the enabling condition, so removing ENABLED removes the       *)
(*        verification value.  The performance note now recommends keeping *)
(*        the ENABLED formulation and only dropping S20 entirely if TLC    *)
(*        runtime becomes prohibitive (the TypeOK range + ProcessCrash     *)
(*        guard already enforce the budget; S20 is a regression guard).    *)
(*   T4: MERGE ABSTRACTION cross-reference added to NAMING BRIDGE table.  *)
(*        The naming bridge now notes that TLA+ mergeStatus aggregates     *)
(*        per-tier what BDD tracks per-task_id, directing readers to the   *)
(*        MERGE ABSTRACTION section in the module header for rationale.    *)
(*   T5: VARIABLE-TO-AGGREGATE OWNERSHIP block added after VARIABLES.     *)
(*        Lists which TLA+ variables belong to which database table        *)
(*        aggregate, making the boundary between aggregates explicit       *)
(*        rather than implicit in the naming bridge.                       *)
(*   T6: SCHEMA MIGRATION note added to INTENTIONAL ABSTRACTION BOUNDARY. *)
(*        Documents that column additions to existing tables require       *)
(*        manual deletion of vibe-state.db because the schema uses        *)
(*        CREATE TABLE IF NOT EXISTS (no ALTER TABLE / migration system).  *)
(*   T2: ForceUnlock IDLE FEATURE RECOVERY PATH documented.  ForceUnlock  *)
(*        clears activeFeature to NULL; an idle feature that lost its      *)
(*        session must be re-selected via SetActiveFeature before it can   *)
(*        re-acquire the lock.  This path is sound: SetActiveFeature       *)
(*        accepts idle features, and SF(SetActiveFeature) guarantees       *)
(*        eventual re-selection.  However, ForceUnlock has no fairness,    *)
(*        so the recovery is only available if the operator re-invokes     *)
(*        the pipeline — the system does not auto-resume after a forced    *)
(*        unlock.                                                          *)
(*   T1: ProcessCrash UNCONDITIONAL activeFeature CLEAR documented.       *)
(*        ProcessCrash sets activeFeature' = NULL unconditionally, even    *)
(*        when activeFeature is already NULL or points to a different      *)
(*        feature.  The BDD is more constrained (crash recovery clears     *)
(*        the active feature only if it matches the crashing feature).     *)
(*        The TLA+ spec is intentionally LOOSER: the unconditional clear  *)
(*        is safe because (a) only one feature can be running at a time   *)
(*        (S1), (b) a crashing feature must hold the lock (guard), and    *)
(*        (c) the lock holder is always the active feature in practice.   *)
(*        The extra looseness means TLC explores states where              *)
(*        activeFeature was already NULL before the crash — these are     *)
(*        unreachable in the real system but harmless in the model and    *)
(*        add no false positives.  Tightening to match BDD would require *)
(*        an additional guard (activeFeature = f) that reduces state      *)
(*        space without adding verification value.                        *)
(*                                                                        *)
(* Revision 12: Addresses 4 debate objections (fourth round):              *)
(*   OBJ-1: NAMING BRIDGE added (see table above).  The BDD action        *)
(*        mapping table (bdd.feature lines 63-72) maps BDD function names  *)
(*        to TLA+ action names but does not document the variable↔column   *)
(*        naming inversion.  Readers tracing featureStatus in TLA+ to the  *)
(*        BDD would search for "feature_status" and miss the actual column *)
(*        (features.status).  The bridge table above makes this explicit.  *)
(*   OBJ-2: DOMAIN RULE COMMENTS added to AcquireLock and HaltPipeline    *)
(*        explaining WHY cross-aggregate atomicity is required from a      *)
(*        domain perspective, not just a technical one.  AcquireLock must  *)
(*        atomically set featureStatus, pipelineState, and lockHolder      *)
(*        because the domain rule is: "a feature is running if and only    *)
(*        if it holds the pipeline lock and the pipeline is active."       *)
(*        Splitting the writes would create observable intermediate states *)
(*        violating RunningImpliesLockHeld (S9) and RunningStateConsistent *)
(*        (S17).  HaltPipeline must atomically halt the feature, update    *)
(*        pipelineState, fail pending debates, and clean up tiers because  *)
(*        the domain rule is: "halting is an irreversible atomic event     *)
(*        that closes all open work."  Partial halting would leave orphaned*)
(*        debate/tier state with no resolution path.                       *)
(*   OBJ-3: S23 (NoneStateConsistent) — new invariant asserting           *)
(*        featureStatus[f] = "none" => pipelineState[f] = "none".         *)
(*        Closes the sync coverage gap: S5/S17/S18/S19 constrain halted,  *)
(*        running, complete, and idle states, but "none" (feature not yet  *)
(*        created) was only correct by construction.  Now formally         *)
(*        guarded against Init regression or a future action that might    *)
(*        set pipelineState without creating the feature first.            *)
(*        Together with S5, S17, S18, and S19, ALL five featureStatus      *)
(*        values now have explicit pipelineState synchronization           *)
(*        invariants, providing complete denormalization coverage.         *)
(*   OBJ-4: S20 (CrashBudgetEnforced) ENABLED PERFORMANCE NOTE added     *)
(*        both in the .tla invariant comment and in the .cfg file.         *)
(*        ENABLED ProcessCrash(f) requires TLC to evaluate the full        *)
(*        enabling condition of ProcessCrash for every reachable state,    *)
(*        which is more expensive than a simple state predicate.  At the   *)
(*        current constant bounds (Features={f1}, MaxCrashes=2) this is    *)
(*        negligible, but scaling to larger Features sets or higher         *)
(*        MaxCrashes values would multiply the cost.  If TLC runtime       *)
(*        becomes a concern, S20 can be REMOVED entirely (not replaced    *)
(*        with a non-ENABLED formulation — see T3 Revision 13 note in     *)
(*        the S20 invariant comment explaining why no non-ENABLED          *)
(*        equivalent exists; the previously suggested formulation was a    *)
(*        tautology).  The crash budget is already enforced structurally   *)
(*        by TypeOK + ProcessCrash's guard; S20 is a regression guard.    *)
(*                                                                        *)
(* Revision 11: Fixes ForceUnlock livelock (TLC liveness violation).       *)
(*   TLC found a lasso: AcquireLock → ForceUnlock → SetActiveFeature →    *)
(*   AcquireLock → ... repeating forever.  ForceUnlock (no fairness)      *)
(*   reset running features to "idle", allowing re-acquisition of the     *)
(*   lock.  The adversarial scheduler picked ForceUnlock every step,      *)
(*   starving all progress actions and violating L1–L4.                   *)
(*   FIX: ForceUnlock now transitions running features to "halted" (not   *)
(*   "idle").  This is semantically correct: ForceUnlock is manual        *)
(*   operator intervention for stuck pipelines — after manual             *)
(*   intervention the pipeline enters a terminal state, not an auto-      *)
(*   resumable state.  ProcessCrash (automated recovery) remains the      *)
(*   "idle" path for automated crash recovery.                            *)
(*   ADDITIONAL CLEANUP: ForceUnlock now performs full HaltPipeline-style  *)
(*   cleanup for running features:                                        *)
(*     - Fails pending debates (prevents orphaned debate state → L2)      *)
(*     - Cleans up running tiers (tasks>0 → "failed", tasks=0 → "none")  *)
(*     - Cleans up pending tiers (→ "none")                               *)
(*     - Resets pending merges on running tiers                           *)
(*   This ensures invariants S5, S11, S12, S13, S16, S21 hold after      *)
(*   ForceUnlock, matching HaltPipeline's cleanup guarantees.             *)
(*                                                                        *)
(* Revision 10: Addresses 4 debate objections (third round):              *)
(*   OBJ-1: S3 (StageMonotonic) REMOVED — it asserted                    *)
(*        lastCompleted[f] \in 0..MaxStage, which is identical to the     *)
(*        TypeOK range constraint.  True monotonicity is provided by L6   *)
(*        (StageNeverDecreases), the temporal property that asserts        *)
(*        lastCompleted never decreases across steps.  Keeping S3 as a    *)
(*        separate invariant provided no additional verification value     *)
(*        and was misleading (the name "StageMonotonic" implied ordering   *)
(*        semantics that the predicate did not express).                   *)
(*   OBJ-2: ForceUnlock action added — models BDD "Unlock-PipelineState   *)
(*        with force flag succeeds regardless of feature status" (line    *)
(*        445).  The force flag bypasses the terminal-status guard of      *)
(*        ReleaseLock, allowing lock release for ANY feature status.       *)
(*        This is the operator escape hatch for stuck pipelines (e.g.,    *)
(*        crash budget exhausted, stale lock from killed process).        *)
(*        ForceUnlock has NO fairness — it is an operator-initiated       *)
(*        manual intervention, not an automated system guarantee.         *)
(*        Added to INTENTIONAL ABSTRACTION BOUNDARY note.                 *)
(*        UPDATE (Revision 11): ForceUnlock now halts running features    *)
(*        instead of resetting to idle.  See Revision 11 notes above.     *)
(*   OBJ-3: S21 (NoneTierNoTasks) — new invariant asserting              *)
(*        tierStatus[f][t] = "none" => tierTasksDone[f][t] = 0.           *)
(*        Guards against orphaned task counts after HaltPipeline resets   *)
(*        a taskless running tier to "none".  Currently correct by        *)
(*        construction (HaltPipeline only resets taskless running tiers   *)
(*        to "none", and no other action sets tierStatus to "none" with   *)
(*        nonzero tasks), but unguarded against regressions where a       *)
(*        future action might reset a tier to "none" without zeroing      *)
(*        its task count.                                                  *)
(*   OBJ-4: S22 (RunningTierNoVerdict) — new invariant asserting         *)
(*        tierStatus[f][t] = "running" => gateVerdict[f][t] = "none".    *)
(*        Currently correct by construction: GatePass and GateFail        *)
(*        atomically transition the tier OUT of "running" (to "passed"    *)
(*        or "failed") in the same action that sets the verdict.  But     *)
(*        without an explicit invariant, a regression that sets           *)
(*        gateVerdict without changing tierStatus would go undetected.    *)
(*        This invariant makes the coupling explicit and regression-safe. *)
(*                                                                        *)
(* Revision 9: Addresses 6 debate objections (second round):              *)
(*   OBJ-1: ProcessCrash mergeStatus='merged' reset documented —          *)
(*        intentional: tasks are zeroed on crash, so the "merged" result  *)
(*        references abandoned work and must be discarded.  On resume     *)
(*        the tier redoes tasks from scratch, producing a fresh merge.    *)
(*   OBJ-2: S11 (DebateStageConsistency) extended to all non-"none"       *)
(*        consensus values, not just "pending".  Prevents "reached" or    *)
(*        "failed" consensus on non-debate stages (regression guard).     *)
(*   OBJ-3: AcquireLock guard simplified from {"idle","running"} to       *)
(*        "idle" — the "running" branch was unreachable dead code         *)
(*        because S9 (RunningImpliesLockHeld) + LockFree makes            *)
(*        featureStatus="running" unsatisfiable when the lock is free.    *)
(*   OBJ-4: S20 (CrashBudgetEnforced) — formal invariant replacing       *)
(*        prose-only crash budget documentation.  Uses ENABLED to verify  *)
(*        ProcessCrash is disabled at MaxCrashes.                         *)
(*   OBJ-5: L5 comment corrected — MergeConflict cited as "possible"      *)
(*        not "guaranteed" path.  Only WF(CompleteMerge) is the           *)
(*        guaranteed liveness anchor.                                     *)
(*   OBJ-6: S3 (StageMonotonic) strengthened to assert lastCompleted      *)
(*        never decreases, plus StageNeverDecreases temporal property.    *)
(*        UPDATE (Revision 10): S3 removed as redundant with TypeOK.      *)
(*        StageNeverDecreases (L6) is the sole monotonicity guarantee.    *)
(*                                                                        *)
(* Revision 8: Addresses 5 debate objections from unified debate:         *)
(*   S19: IdleStateConsistent — featureStatus = "idle" implies            *)
(*        pipelineState = "none".  Completes the full pipelineState/      *)
(*        featureStatus sync coverage (S5 halted, S17 running, S18        *)
(*        complete, S19 idle).  After crash recovery resets a feature to  *)
(*        "idle", pipelineState must be "none" — without this invariant,  *)
(*        a regression could leave pipelineState = "running" while the    *)
(*        feature is idle, creating an inconsistent database state.       *)
(*   CRASH-RESUME-MID-STAGE-7: Documented that EnterStage7 is            *)
(*        permanently blocked after a mid-Stage-7 crash because it        *)
(*        guards all tiers = "none" while crash resets running tiers to   *)
(*        "pending".  StartTier is the correct resume entry point.        *)
(*        TLC verifies no starvation via SF(AcquireLock) + WF(StartTier).*)
(*   L5 LIVENESS ANCHOR: Documented WF(CompleteMerge) as the fairness    *)
(*        condition driving L5 (MergeEventuallyResolves), analogous to    *)
(*        L3's conditional nature documentation.                          *)
(*   MERGE ABSTRACTION: Documented that the spec models mergeStatus per   *)
(*        tier while the BDD models per task_id — an intentional          *)
(*        abstraction where per-tier is the coarser but sufficient grain  *)
(*        for verifying pipeline lifecycle properties.                    *)
(*   ABSTRACTION BOUNDARY EXPANSION: Added pipelineState runtime columns  *)
(*        (review_round, verdict, current_stage) to the intentional       *)
(*        abstraction boundary note alongside artifacts/outputs.          *)
(*                                                                        *)
(* Revision 7: HaltPipeline pending-tier cleanup.                         *)
(*   HaltPipeline now resets "pending" tiers to "none" in addition to     *)
(*   cleaning up "running" tiers.  Without this, a taskless running tier  *)
(*   resetting to "none" leaves later pending tiers orphaned, violating   *)
(*   TierSequentialOrder Part B (activation ordering).  TLC found this    *)
(*   via the path: EnterStage7 → StartTier(1) → HaltPipeline producing   *)
(*   tierStatus = <<"none", "pending">>.                                  *)
(*                                                                        *)
(* Revision 6: Addresses 13 debate objections:                            *)
(*   D1:  Add S17 (RunningStateConsistent) and S18 (CompleteStateConsistent) *)
(*        — pipelineState/featureStatus sync now checked for ALL terminal  *)
(*        states, not just halted (S5).  Three experts converged on gap.  *)
(*   D2:  ProcessCrash zeros tierTasksDone for reset tiers.  Previously   *)
(*        tasks accumulated on top of abandoned pre-crash counts.         *)
(*   D3:  L3 (DatabaseEventuallyCloses) documented as conditional on      *)
(*        crash budget not being exhausted mid-run with manual-only       *)
(*        recovery path.                                                  *)
(*   D4:  HaltPipeline mergeStatus cleanup comment added explaining       *)
(*        pre-state evaluation semantics (correct but fragile).           *)
(*   D5:  SF on SetActiveFeature comment extended for |Features|=1 case.  *)
(*   D6:  S12 (TierSequentialOrder) extended to cover "pending" tier      *)
(*        predecessors: if a tier is activated (not "none"), all prior    *)
(*        tiers must also be activated.                                   *)
(*   D7:  .cfg updated: MaxCrashes=2 for CI verification.                *)
(*   D8:  EnterStage7 bulk-initializes ALL tiers to "pending", matching  *)
(*        BDD scenario "Initialize all tiers to pending".                *)
(*   D9:  ExecuteStage BDD traceability comment added.                   *)
(*   D10: AcquireLock cross-aggregate write documented and justified.    *)
(*   D11: SetActiveFeature displacement guard documented — existing      *)
(*        guards already prevent displacing a running feature.           *)
(*   D12: Verdict structural mapping documented (BDD feature-level       *)
(*        verdict vs. TLA+ per-tier gateVerdict).                        *)
(*   D13: AdvanceTier removed.  Sequential guard moved to StartTier.     *)
(*        Eliminates circular dependency between AdvanceTier and S12.    *)
(*                                                                        *)
(* Revision 5: HaltPipeline taskless-tier fix (TierFailRequiresTasks).    *)
(* Revision 4: Addresses all 8 debate objections from unified debate:     *)
(*   1. ProcessCrash resets running tiers to "pending" (deadlock fix)     *)
(*   2. HaltPipeline resets running tiers to "failed" (terminal cleanup)  *)
(*   3. merge_results modeled as first-class aggregate                    *)
(*   4. Intentional abstraction boundary documented (artifacts, outputs)  *)
(*   5. ASSUME Tiers /= {} added (vacuous AllTiersPassed fix)            *)
(*   6. ASSUME MaxStage >= 3 added (empty debate range fix)              *)
(*   7. GatePass/GateFail WF justification documented                    *)
(*   8. MaxCrashes exceeded behavior documented                          *)
(*                                                                        *)
(* INTENTIONAL ABSTRACTION BOUNDARY                                       *)
(* The following BDD aggregates are deliberately omitted from this spec:  *)
(*   - artifacts (file_path registration/retrieval)                      *)
(*   - stage_outputs (JSON blob storage)                                 *)
(*   - pipelineState runtime columns: review_round, verdict,             *)
(*     current_stage, and other pipeline_state fields beyond the          *)
(*     pipeline_state status enum.  The TLA+ spec models only the        *)
(*     status field ("none"/"running"/"halted"/"complete") because that   *)
(*     is the value participating in state-machine transitions.  The     *)
(*     additional columns are metadata written alongside status updates   *)
(*     but do not guard any transitions or appear in any invariant.      *)
(*     Their correctness is ensured by the BDD scenarios for             *)
(*     Update-PipelineState / Get-PipelineState.                         *)
(*   - ForceUnlock detailed semantics: the TLA+ ForceUnlock action       *)
(*     models the essential behavior (lock release regardless of status)  *)
(*     but omits the BDD's PID-check and stale-lock-detection details.   *)
(*     These are implementation concerns (how the force flag is           *)
(*     validated) rather than state-machine transitions.  The BDD         *)
(*     scenarios for Unlock-PipelineState cover these details.           *)
(* These are pure data-storage tables/columns with no state-machine      *)
(* transitions, no cross-aggregate invariants, and no liveness           *)
(* requirements.  Their correctness is fully covered by unit-level BDD   *)
(* scenarios (CRUD operations with :memory: databases).  Including them  *)
(* would expand the state space without adding verification value for    *)
(* the pipeline lifecycle properties this spec targets.                  *)
(*                                                                        *)
(* SCHEMA MIGRATION (T6 — Revision 13):                                   *)
(* The schema uses CREATE TABLE IF NOT EXISTS with no ALTER TABLE or      *)
(* migration system (schema versioning is explicitly out of scope — see   *)
(* elicitor.md "Out of scope").  This means:                              *)
(*   - Adding a column to an existing table requires MANUAL DELETION of   *)
(*     vibe-state.db so that the next Open-StateDatabase recreates the    *)
(*     table with the new column.  Without deletion, CREATE TABLE IF NOT  *)
(*     EXISTS silently skips the table, and the new column is absent.     *)
(*   - This is the same behavior as the BDD "Database deleted manually    *)
(*     is fully re-initialized" scenario — deletion triggers a clean      *)
(*     start.                                                             *)
(*   - The TLA+ spec does not model schema evolution because the column   *)
(*     set is fixed per spec revision.  Each spec revision implicitly     *)
(*     assumes a fresh database with the matching schema.                 *)
(*                                                                        *)
(* merge_results IS modeled because merges have distinct failure modes    *)
(* (conflict detection) that interact with tier progression and pipeline  *)
(* halting — a merge conflict can block tier completion.                  *)
(*                                                                        *)
(* MERGE ABSTRACTION (Revision 8)                                         *)
(* The BDD models merge_results per task_id (each task produces a merge  *)
(* result row keyed by task_id).  The TLA+ spec models mergeStatus per   *)
(* tier — a coarser grain.  This is intentional: for pipeline lifecycle  *)
(* verification, the relevant question is "did THIS TIER's merge succeed *)
(* or conflict?", not "which specific task's merge conflicted?".  The    *)
(* per-tier abstraction captures the essential dynamics (merge success    *)
(* gates tier progression; merge conflict halts the feature) while       *)
(* avoiding a combinatorial explosion from per-task merge state.  The    *)
(* per-task granularity is covered by unit BDD scenarios for             *)
(* Set-MergeResults / Get-MergeResults.                                  *)
(*                                                                        *)
(* VERDICT STRUCTURAL MAPPING (D12)                                       *)
(* The BDD pipeline_state table has a feature-level "verdict" field.  The *)
(* TLA+ spec models gateVerdict per tier because gate evaluation is the  *)
(* mechanism that PRODUCES the verdict — one gate per tier.  The BDD's   *)
(* feature-level verdict is a derived value: the pipeline is "pass" only  *)
(* when ALL tier gates pass (AllTiersPassed), and "fail" if ANY tier gate *)
(* fails.  S7 (GateVerdictConsistent) ensures per-tier consistency; S4   *)
(* (NoCompletionWithoutAllStages) and AllTiersPassed ensure the aggregate *)
(* semantics match the BDD's feature-level field.                        *)
(**************************************************************************)

EXTENDS Integers, Sequences, FiniteSets, TLC

CONSTANTS
    Features,       \* Set of feature names (e.g., {"f1"})
    MaxStage,       \* Highest pipeline stage number (real system: 7)
    MaxDebateRound, \* Max debate rounds per stage
    Tiers,          \* Set of tier numbers for Stage 7 (e.g., {1, 2})
    MaxTasks,       \* Max tasks per tier
    MaxCrashes,     \* Max crash recoveries before model stops crashing
    NULL            \* Sentinel for "no value"

ASSUME MaxStage \in Nat /\ MaxStage >= 3
    \* MaxStage >= 3 required so that StageNeedsDebate(s) = s \in 2..(MaxStage-1)
    \* produces a non-empty range.  At MaxStage=2 the range is 2..1 = {},
    \* which silently disables ALL debate, breaking liveness property L2.
    \* The real system uses MaxStage=7; the minimal model uses MaxStage=3
    \* (stage 1 = no debate, stage 2 = debate, stage 3 = coding tiers).

ASSUME MaxDebateRound \in Nat /\ MaxDebateRound >= 1
ASSUME MaxTasks \in Nat /\ MaxTasks >= 1
ASSUME MaxCrashes \in Nat /\ MaxCrashes >= 1

ASSUME Tiers \subseteq Nat
ASSUME Tiers /= {}
    \* Tiers must be non-empty.  AllTiersPassed(f) is a universal quantifier
    \* over Tiers; if Tiers = {} it is vacuously TRUE, allowing CompleteStage7
    \* to fire with zero tier work — bypassing the entire coding phase.

ASSUME NULL \notin Features

(**************************************************************************)
(* VARIABLES                                                              *)
(**************************************************************************)

VARIABLES
    \* --- database lifecycle ---
    dbOpen,             \* BOOLEAN -- whether Open-StateDatabase has been called

    \* --- session table (single row, id=1) ---
    activeFeature,      \* NULL or feature name

    \* --- features table ---
    featureStatus,      \* [Features -> {"none","idle","running","complete","halted"}]
                        \* "none" = not yet created (New-Feature not yet called)

    \* --- stage_progress ---
    lastCompleted,      \* [Features -> 0..MaxStage]  (0 = no stage done)

    \* --- pipeline_lock table + system mutex ---
    lockHolder,         \* NULL or feature name that holds the lock
    crashCount,         \* [Features -> 0..MaxCrashes]

    \* --- pipeline_state table ---
    pipelineState,      \* [Features -> {"none","running","halted","complete"}]

    \* --- debate_state table ---
    debateRound,        \* [Features -> [1..MaxStage -> 0..MaxDebateRound]]
    debateConsensus,    \* [Features -> [1..MaxStage -> {"none","pending","reached","failed"}]]

    \* --- tier_progress (Stage 7) ---
    tierStatus,         \* [Features -> [Tiers -> {"none","pending","running","passed","failed"}]]

    \* --- task_results (Stage 7) ---
    tierTasksDone,      \* [Features -> [Tiers -> 0..MaxTasks]]

    \* --- gate_results (Stage 7) ---
    gateVerdict,        \* [Features -> [Tiers -> {"none","pass","fail"}]]

    \* --- merge_results (Stage 7) ---
    \* Models the merge step that follows task completion within a tier.
    \* Each tier's tasks produce workspace changes that must be merged back.
    \* Merges can succeed or hit conflicts; a conflict halts the feature.
    \* BDD: "Record a merge result" / "Merge conflict halts the feature"
    \*
    \* ABSTRACTION NOTE (Revision 8): This is modeled per-tier, not per-task_id
    \* as in the BDD.  See MERGE ABSTRACTION in the module header for rationale.
    mergeStatus         \* [Features -> [Tiers -> {"none","pending","merged","conflict"}]]

vars == <<dbOpen, activeFeature, featureStatus, lastCompleted,
          lockHolder, crashCount,
          pipelineState, debateRound, debateConsensus,
          tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

(**************************************************************************)
(* VARIABLE-TO-AGGREGATE OWNERSHIP (T5 — Revision 13)                     *)
(*                                                                        *)
(* Each TLA+ variable belongs to exactly one database table aggregate.    *)
(* Cross-aggregate writes (actions that mutate variables from different    *)
(* aggregates in one step) are documented at the action site and must be  *)
(* justified by a domain rule.  See AcquireLock and HaltPipeline for     *)
(* examples of justified cross-aggregate atomicity.                       *)
(*                                                                        *)
(*   Aggregate         TLA+ Variables                                     *)
(*   ──────────────    ──────────────────────────────────────              *)
(*   (runtime)         dbOpen                                              *)
(*   session           activeFeature                                       *)
(*   features          featureStatus                                       *)
(*   stage_progress    lastCompleted                                       *)
(*   pipeline_lock     lockHolder, crashCount                              *)
(*   pipeline_state    pipelineState                                       *)
(*   debate_state      debateRound, debateConsensus                        *)
(*   tier_progress     tierStatus                                          *)
(*   task_results      tierTasksDone                                       *)
(*   gate_results      gateVerdict                                         *)
(*   merge_results     mergeStatus                                         *)
(*                                                                        *)
(* NOT MODELED (see INTENTIONAL ABSTRACTION BOUNDARY in module header):   *)
(*   artifacts, stage_outputs, pipeline_state runtime columns             *)
(**************************************************************************)

(**************************************************************************)
(* TYPE INVARIANT                                                         *)
(**************************************************************************)

TypeOK ==
    /\ dbOpen \in BOOLEAN
    /\ activeFeature \in Features \cup {NULL}
    /\ lockHolder \in Features \cup {NULL}
    /\ \A f \in Features :
        /\ featureStatus[f] \in {"none", "idle", "running", "complete", "halted"}
        /\ lastCompleted[f] \in 0..MaxStage
        /\ crashCount[f] \in 0..MaxCrashes
        /\ pipelineState[f] \in {"none", "running", "halted", "complete"}
        /\ \A s \in 1..MaxStage :
            /\ debateRound[f][s] \in 0..MaxDebateRound
            /\ debateConsensus[f][s] \in {"none", "pending", "reached", "failed"}
        /\ \A t \in Tiers :
            /\ tierStatus[f][t] \in {"none", "pending", "running", "passed", "failed"}
            /\ tierTasksDone[f][t] \in 0..MaxTasks
            /\ gateVerdict[f][t] \in {"none", "pass", "fail"}
            /\ mergeStatus[f][t] \in {"none", "pending", "merged", "conflict"}

(**************************************************************************)
(* HELPERS                                                                *)
(**************************************************************************)

IsRunning(f) == featureStatus[f] = "running"
LockFree == lockHolder = NULL
AllStagesDone(f) == lastCompleted[f] = MaxStage
NextStage(f) == lastCompleted[f] + 1

\* Stages 2..(MaxStage-1) have expert debates; stage 1 and MaxStage do not.
\* ASSUME MaxStage >= 3 guarantees this range is non-empty.
StageNeedsDebate(s) == s \in 2..(MaxStage - 1)

\* All Stage 7 tiers passed their gates.
\* ASSUME Tiers /= {} guarantees this is not vacuously true.
AllTiersPassed(f) == \A t \in Tiers : tierStatus[f][t] = "passed"

\* Symmetry set for model checking performance (invariant-only; not safe with liveness)
Features_symm == Permutations(Features)

(**************************************************************************)
(* INIT                                                                   *)
(**************************************************************************)

Init ==
    /\ dbOpen = FALSE
    /\ activeFeature = NULL
    /\ featureStatus = [f \in Features |-> "none"]
    /\ lastCompleted = [f \in Features |-> 0]
    /\ lockHolder = NULL
    /\ crashCount = [f \in Features |-> 0]
    /\ pipelineState = [f \in Features |-> "none"]
    /\ debateRound = [f \in Features |-> [s \in 1..MaxStage |-> 0]]
    /\ debateConsensus = [f \in Features |-> [s \in 1..MaxStage |-> "none"]]
    /\ tierStatus = [f \in Features |-> [t \in Tiers |-> "none"]]
    /\ tierTasksDone = [f \in Features |-> [t \in Tiers |-> 0]]
    /\ gateVerdict = [f \in Features |-> [t \in Tiers |-> "none"]]
    /\ mergeStatus = [f \in Features |-> [t \in Tiers |-> "none"]]

(**************************************************************************)
(* DATABASE LIFECYCLE                                                     *)
(**************************************************************************)

\* Open-StateDatabase: init connection, run schema (CREATE TABLE IF NOT EXISTS).
\* Idempotent on existing tables -- subsequent runs are no-ops.
\* BDD: "First run creates database file and all 12 tables"
\*      "Subsequent run is a no-op on existing database"
OpenDatabase ==
    /\ ~dbOpen
    /\ dbOpen' = TRUE
    /\ UNCHANGED <<activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Close-StateDatabase: close connection.
\* Guards: lock released, active feature cleared (clean shutdown).
\* BDD: "Close-StateDatabase rejected while lock is held"
\*      "Close-StateDatabase rejected while active feature is set"
CloseDatabase ==
    /\ dbOpen
    /\ lockHolder = NULL
    /\ activeFeature = NULL
    /\ dbOpen' = FALSE
    /\ UNCHANGED <<activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

(**************************************************************************)
(* FEATURE LIFECYCLE                                                      *)
(**************************************************************************)

\* New-Feature: insert feature with status "idle" (error if already exists).
\* BDD: "Duplicate feature name produces error"
CreateFeature(f) ==
    /\ dbOpen
    /\ featureStatus[f] = "none"
    /\ featureStatus' = [featureStatus EXCEPT ![f] = "idle"]
    /\ UNCHANGED <<dbOpen, activeFeature, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Set-ActiveFeature: upsert the session's active feature.
\* BDD: "Set active feature replaces previous value"
\*      "Set active feature on empty session"
\*
\* DISPLACEMENT SAFETY (D11):
\* The guard chain prevents unsafe displacement of a running feature:
\*   1. \A f2 /= f : featureStatus[f2] /= "running"
\*      → if activeFeature = f2 and f2 is running, this guard BLOCKS
\*   2. ActiveFeatureMustExist (S8) guarantees activeFeature points to an
\*      existing feature, so the displaced feature is in {idle, complete, halted}
\*   3. An idle displaced feature has no in-progress work (lock not yet acquired)
\*   4. A complete/halted displaced feature is already terminal
\* Therefore the BDD "replaces" semantics are safe without an explicit Clear
\* step, though Clear-then-Set is the recommended workflow.
SetActiveFeature(f) ==
    /\ dbOpen
    /\ featureStatus[f] \in {"idle", "running"}
    \* No OTHER feature may be running (mutex semantics)
    /\ \A f2 \in Features : f2 /= f => featureStatus[f2] /= "running"
    /\ activeFeature' = f
    /\ UNCHANGED <<dbOpen, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Clear-ActiveFeature: null out on completion or halt.
\* Guard: the active feature must be in a terminal state.
\* An "idle" feature (e.g., after crash recovery) must NOT be cleared --
\* it needs to re-acquire the lock and resume.  Without this guard,
\* ClearActiveFeature can fire immediately after SetActiveFeature in a
\* crash-recovery cycle, creating a lasso that starves the pending debate.
\* BDD: "Clear active feature rejected for idle feature"
\*      "Clear active feature rejected for running feature"
ClearActiveFeature ==
    /\ dbOpen
    /\ activeFeature /= NULL
    /\ featureStatus[activeFeature] \in {"complete", "halted"}
    /\ activeFeature' = NULL
    /\ UNCHANGED <<dbOpen, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

(**************************************************************************)
(* PIPELINE LOCKING (system mutex + pipeline_lock table)                  *)
(**************************************************************************)

\* Lock-PipelineState: acquire lock, write PID/startTime to pipeline_lock.
\* Transitions feature from "idle" to "running".
\* BDD: "Acquire pipeline lock"
\*
\* CROSS-AGGREGATE WRITE (D10):
\* This action atomically mutates featureStatus (features table),
\* pipelineState (pipeline_state table), and lockHolder (pipeline_lock
\* table) — three distinct database tables in one transition.  This is
\* intentional: in the real system, these three writes are wrapped in a
\* SQLite transaction (BEGIN/COMMIT) to prevent partial state.  The TLA+
\* spec models the transaction as a single atomic step, which is the
\* correct abstraction for SQLite's serialized transaction semantics.
\* Splitting into separate actions would introduce intermediate states
\* (e.g., running but unlocked) that violate RunningImpliesLockHeld (S9).
\*
\* DOMAIN RULE (Revision 12 — OBJ-2):
\* The conceptual justification for atomicity is: "A feature is running if
\* and only if it holds the pipeline lock AND the pipeline is active."
\* This is a domain-level invariant, not a technical convenience:
\*   - featureStatus="running" without lockHolder=f → another process could
\*     start work on the same feature (violates S9 RunningImpliesLockHeld)
\*   - lockHolder=f without featureStatus="running" → the lock is held by a
\*     non-running feature, preventing other features from acquiring it
\*     (violates S2 LockExclusive for the "running" requirement)
\*   - pipelineState="running" without featureStatus="running" → the
\*     pipeline_state table claims an active run but the feature is dormant
\*     (violates S17 RunningStateConsistent)
\* All three must transition together because the domain treats "pipeline
\* lock acquisition" as a single indivisible event, not three independent
\* database writes that happen to co-occur.
AcquireLock(f) ==
    /\ dbOpen
    /\ LockFree
    /\ activeFeature = f
    \* DEAD CODE REMOVED (OBJ-3, Revision 9): Previously guarded {"idle", "running"}.
    \* The "running" branch was unreachable: S9 guarantees running => lockHolder = f,
    \* and LockFree requires lockHolder = NULL.  These are contradictory, so
    \* featureStatus[f] = "running" /\ LockFree is unsatisfiable.
    /\ featureStatus[f] = "idle"
    /\ lockHolder' = f
    /\ featureStatus' = [featureStatus EXCEPT ![f] = "running"]
    /\ pipelineState' = [pipelineState EXCEPT ![f] = "running"]
    /\ UNCHANGED <<dbOpen, activeFeature, lastCompleted, crashCount,
                   debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Unlock-PipelineState: release lock (clear pipeline_lock row).
\* Guard: feature must have completed or halted before releasing.
\* A "running" feature cannot release -- it must finish first.
\* BDD: "Release pipeline lock"
ReleaseLock(f) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ featureStatus[f] \in {"complete", "halted"}
    /\ lockHolder' = NULL
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Unlock-PipelineState with force flag: release lock regardless of feature status.
\* BDD: "Unlock-PipelineState with force flag succeeds regardless of feature status"
\*      (bdd.feature line 445)
\*
\* This is the operator escape hatch for stuck pipelines:
\*   - Crash budget exhausted (crashCount = MaxCrashes, stale lock persists)
\*   - Stale lock from a killed process that the PID check identified
\*   - Manual intervention to unblock a deadlocked pipeline
\*
\* Unlike ReleaseLock, ForceUnlock does NOT require the feature to be in a
\* terminal state.  It releases the lock for ANY feature status, including
\* "running".  To prevent violating RunningImpliesLockHeld (S9), ForceUnlock
\* transitions a running feature to "halted" (a terminal state).
\*
\* HALTED vs. IDLE (Revision 11 — livelock fix):
\* Previously ForceUnlock reset running features to "idle" (same as ProcessCrash),
\* allowing the feature to re-acquire the lock and resume.  TLC found a livelock:
\* AcquireLock → ForceUnlock → SetActiveFeature → AcquireLock → ... forever.
\* Since ForceUnlock has no fairness, the adversarial scheduler can pick it every
\* step, starving all progress actions and violating L1–L4.
\*
\* The fix: ForceUnlock now halts running features.  This is semantically correct:
\*   - ProcessCrash = automated recovery → "idle" (auto-resumable)
\*   - ForceUnlock = manual intervention → "halted" (terminal, operator decides next)
\* After a ForceUnlock, the operator must create a new feature or take other manual
\* action — the pipeline does not auto-resume from a forced unlock.
\*
\* CLEANUP: ForceUnlock performs full HaltPipeline-style cleanup for running
\* features: fail pending debates, clean up tiers, reset pending merges.
\* This ensures all invariants (S5, S11, S12, S13, S16, S21) hold after
\* ForceUnlock, matching HaltPipeline's guarantees.
\*
\* FAIRNESS: ForceUnlock has NO fairness — it is an operator-initiated
\* manual intervention, not an automated system guarantee.  The system
\* does not promise to eventually force-unlock; it only allows it.
\* This is analogous to HaltPipeline (also no fairness).
\*
\* IDLE FEATURE RECOVERY PATH (T2 — Revision 13):
\* ForceUnlock unconditionally clears activeFeature to NULL.  If the feature
\* was idle (defensive case — an idle feature shouldn't hold the lock, but
\* ForceUnlock is permissive), the feature KEEPS its "idle" status but loses
\* its session.  The recovery path for such a feature is:
\*   1. Operator re-invokes the pipeline
\*   2. OpenDatabase (WF) reopens the connection
\*   3. SetActiveFeature(f) (SF) re-selects the idle feature
\*   4. AcquireLock(f) (SF) re-acquires the lock, transitioning to "running"
\* This path is sound because:
\*   - SetActiveFeature accepts idle features (guard: featureStatus[f] \in {"idle", "running"})
\*   - AcquireLock accepts idle features (guard: featureStatus[f] = "idle")
\*   - SF on both ensures eventual re-selection and lock acquisition
\* However, since ForceUnlock has no fairness, the operator must manually
\* re-invoke the pipeline — the system does not auto-resume after a
\* forced unlock.  This is intentional: ForceUnlock is manual intervention,
\* and the operator decides whether to resume or abandon the feature.
\*
\* For RUNNING features, ForceUnlock transitions to "halted" (terminal),
\* so the recovery path is different: the operator must create a new feature
\* or take other manual action.  See Revision 11 notes above.
ForceUnlock(f) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ lockHolder' = NULL
    /\ activeFeature' = NULL
    \* If the feature is running, halt it (terminal state — Revision 11).
    \* If the feature is already terminal (complete/halted), preserve its status.
    \* If the feature is idle (shouldn't hold lock, but defensive), keep idle.
    /\ featureStatus' = [featureStatus EXCEPT ![f] =
           IF featureStatus[f] = "running" THEN "halted" ELSE featureStatus[f]]
    /\ pipelineState' = [pipelineState EXCEPT ![f] =
           IF featureStatus[f] = "running" THEN "halted" ELSE pipelineState[f]]
    \* Fail pending debates for running features (same as HaltPipeline).
    \* Prevents orphaned debate state that would violate L2 (DebateTermination).
    /\ debateConsensus' = [debateConsensus EXCEPT ![f] =
           [s \in 1..MaxStage |->
               IF featureStatus[f] = "running" /\ debateConsensus[f][s] = "pending"
               THEN "failed"
               ELSE debateConsensus[f][s]]]
    \* Clean up running and pending tiers (same logic as HaltPipeline).
    \* Running tiers with completed tasks → "failed" (work done but not evaluated).
    \* Running tiers with zero tasks → "none" (no work; "failed" would violate S13).
    \* Pending tiers → "none" (no work started; prevents S12 Part B violation).
    /\ tierStatus' = [tierStatus EXCEPT ![f] =
           [t \in Tiers |->
               IF featureStatus[f] = "running"
               THEN IF tierStatus[f][t] = "running"
                    THEN IF tierTasksDone[f][t] > 0 THEN "failed" ELSE "none"
                    ELSE IF tierStatus[f][t] = "pending"
                    THEN "none"
                    ELSE tierStatus[f][t]
               ELSE tierStatus[f][t]]]
    \* Reset pending merges on running tiers (same as HaltPipeline).
    \* Uses tierStatus (pre-state) — see PRE-STATE EVALUATION note in HaltPipeline.
    /\ mergeStatus' = [mergeStatus EXCEPT ![f] =
           [t \in Tiers |->
               IF featureStatus[f] = "running"
                  /\ tierStatus[f][t] = "running"
                  /\ mergeStatus[f][t] = "pending"
               THEN "none"
               ELSE mergeStatus[f][t]]]
    \* Gate verdicts not reset: running tiers always have gateVerdict = "none"
    \* (S22 RunningTierNoVerdict guarantees this).
    \* tierTasksDone not changed: tiers becoming "failed" keep their task counts
    \* (meaningful work), tiers becoming "none" already have 0 tasks (CompleteTask
    \* requires tierStatus = "running", so pending tiers never have tasks).
    /\ UNCHANGED <<dbOpen, lastCompleted, crashCount,
                   debateRound, tierTasksDone,
                   gateVerdict>>

\* Process crash: OS releases system mutex, stale lock detected via PID check.
\* Crash count incremented. Lock and active session are always released.
\* Stage progress and debate state are PRESERVED (resume support).
\* BDD: "Crash recovery increments crash count and resets feature to idle"
\*      "Stale running tier after crash is reset to pending"
\*
\* IMPORTANT: Only a "running" feature resets to "idle" for resumption.
\* A feature already in a terminal state ("halted" or "complete") KEEPS its
\* status through a crash -- the crash only releases the lock and clears the
\* active session.  Without this, a gate-fail -> crash -> resume cycle would
\* make the feature "running" again while tier state (preserved) shows
\* failure, creating an unresolvable deadlock that violates all liveness
\* properties.  The pipelineState is similarly preserved for terminal
\* features to maintain HaltedStateConsistent (S5).
\*
\* CRASH-RECOVERY FOR RUNNING TIERS (Revision 4 -- deadlock fix):
\* A crash during Stage 7 can leave a tier in "running" status.  On resume,
\* EnterStage7 guards all tiers = "none" and StartTier guards "pending",
\* so the running tier would be unreachable -- a formal deadlock.
\* Fix: crash resets any "running" tier to "pending" and any "pending"
\* merge to "none", allowing the tier to be restarted on resume.
\* This matches real-system behavior: a crashed coding agent's partial
\* work is abandoned, and the tier restarts from its last checkpoint.
\*
\* CRASH-RESUME-MID-STAGE-7 PATH (Revision 8):
\* After a crash during Stage 7, EnterStage7 is PERMANENTLY BLOCKED for this
\* feature because it guards \A t \in Tiers : tierStatus[f][t] = "none", but
\* crash recovery resets running tiers to "pending" and preserves passed tiers.
\* This is CORRECT and INTENTIONAL:
\*   - EnterStage7 is the INITIAL entry point (bulk-initialize all tiers)
\*   - After a crash, tiers already have non-"none" state (pending/passed)
\*   - StartTier is the correct resume entry point: it guards "pending" and
\*     enforces sequential ordering via the predecessor-passed check
\*   - The resume path is: ProcessCrash → SetActiveFeature → AcquireLock →
\*     StartTier(crashed tier) → CompleteTask → ... (continue from checkpoint)
\* TLC verifies no starvation on this path via SF(AcquireLock) ensuring the
\* idle feature re-acquires the lock, and WF(StartTier) ensuring the pending
\* tier eventually starts running.
\*
\* TIER TASK COUNT RESET (D2 -- Revision 6):
\* tierTasksDone is zeroed for any tier reset from "running" to "pending".
\* Without this, on resume the tier's CompleteTask increments on top of the
\* pre-crash count, producing a phantom task total that overstates the
\* actual work done in the resumed tier.  The abandoned tasks from the
\* crashed run are not recoverable and must not count toward the new run.
\*
\* UNCONDITIONAL activeFeature CLEAR (T1 — Revision 13):
\* ProcessCrash sets activeFeature' = NULL unconditionally, without checking
\* whether activeFeature = f.  The BDD "crash recovery" scenario is more
\* constrained: it clears the active feature only if it matches the crashing
\* feature.  The TLA+ spec is intentionally LOOSER because:
\*   (a) S1 (SingleRunningFeature) guarantees at most one running feature
\*   (b) ProcessCrash guards lockHolder = f — only the lock holder crashes
\*   (c) S9 (RunningImpliesLockHeld) guarantees the running feature holds lock
\*   (d) Together, the crashing feature IS the active feature in all reachable
\*       states (activeFeature = f whenever ProcessCrash is enabled)
\* The unconditional clear explores states where activeFeature was already NULL
\* or pointed to a different feature — these are unreachable in the real system
\* (SetActiveFeature is called before AcquireLock in the pipeline flow) but
\* harmless in the model.  TLC verifies all invariants hold in these extra
\* states, providing additional coverage without false positives.
\* Tightening to `activeFeature = f` as a guard or conditional would reduce
\* the explored state space without adding verification value.
ProcessCrash(f) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ crashCount[f] < MaxCrashes
    /\ lockHolder' = NULL
    /\ crashCount' = [crashCount EXCEPT ![f] = crashCount[f] + 1]
    /\ activeFeature' = NULL
    /\ featureStatus' = [featureStatus EXCEPT ![f] =
           IF featureStatus[f] = "running" THEN "idle" ELSE featureStatus[f]]
    /\ pipelineState' = [pipelineState EXCEPT ![f] =
           IF featureStatus[f] = "running" THEN "none" ELSE pipelineState[f]]
    \* Reset running tiers to "pending" for resumption (deadlock fix).
    \* Passed/failed tiers are preserved -- only in-progress work resets.
    /\ tierStatus' = [tierStatus EXCEPT ![f] =
           [t \in Tiers |->
               IF tierStatus[f][t] = "running" THEN "pending"
               ELSE tierStatus[f][t]]]
    \* Zero task counts for reset tiers (D2).
    \* Abandoned pre-crash tasks must not accumulate into the resumed run.
    /\ tierTasksDone' = [tierTasksDone EXCEPT ![f] =
           [t \in Tiers |->
               IF tierStatus[f][t] = "running" THEN 0
               ELSE tierTasksDone[f][t]]]
    \* Reset ALL merge statuses to "none" for running tiers (including "merged").
    \*
    \* INTENTIONAL DISCARD OF "merged" (OBJ-1, Revision 9):
    \* A crash between CompleteMerge and GatePass leaves mergeStatus = "merged"
    \* on a running tier.  This "merged" result is INTENTIONALLY discarded because:
    \*   (a) tierTasksDone is zeroed above — the tasks that produced the merge are
    \*       abandoned, so the merge result references work that no longer counts
    \*   (b) On resume, the tier restarts from "pending" → "running" and redoes
    \*       tasks from scratch, producing a FRESH merge for the new work
    \*   (c) Preserving a stale "merged" status would skip StartMerge (guards
    \*       mergeStatus = "none") and proceed directly to GatePass — evaluating
    \*       the gate against abandoned work, not the resumed work
    \* Completed merges on non-running tiers (passed/failed) are preserved because
    \* those tiers are not reset and their merge results remain valid.
    /\ mergeStatus' = [mergeStatus EXCEPT ![f] =
           [t \in Tiers |->
               IF tierStatus[f][t] = "running" THEN "none"
               ELSE mergeStatus[f][t]]]
    \* Gate verdicts are not reset: a running tier always has gateVerdict = "none"
    \* (S22 RunningTierNoVerdict guarantees this), so there is nothing to reset.
    /\ UNCHANGED <<dbOpen, lastCompleted,
                   debateRound, debateConsensus,
                   gateVerdict>>

(**************************************************************************)
(* MAX CRASHES EXCEEDED -- BEHAVIORAL NOTE                                *)
(*                                                                        *)
(* When crashCount[f] = MaxCrashes, ProcessCrash is disabled for f.       *)
(* In the model this means the system cannot crash again -- TLC explores  *)
(* only crash-free continuations from that point.                         *)
(*                                                                        *)
(* In the real system, exceeding the crash budget means:                  *)
(*   - The pipeline refuses to auto-resume (stale lock is NOT recovered)  *)
(*   - Manual intervention is required (operator clears the lock via      *)
(*     ForceUnlock or direct database manipulation)                       *)
(*   - This is a deliberate safety mechanism: repeated crashes suggest    *)
(*     a systemic issue that should not be auto-retried indefinitely      *)
(*                                                                        *)
(* The model's MaxCrashes cap is conservative: it verifies that the       *)
(* pipeline can recover from up to MaxCrashes faults.  Beyond that, the   *)
(* operator-intervention path (ForceUnlock) is outside the automated      *)
(* pipeline scope but IS modeled for state-machine coverage.              *)
(**************************************************************************)

(**************************************************************************)
(* STAGE PROGRESSION (stages 1..MaxStage)                                 *)
(**************************************************************************)

\* Execute a non-debate stage: direct completion (e.g., stage 1).
\* BDD TRACEABILITY (D9):
\* This action models the pipeline engine's stage execution loop, which is
\* implicit in the BDD scenarios.  The BDD describes stage OUTCOMES (e.g.,
\* "Mark a stage as complete" in Stage Progress, "Store a stage output" in
\* Stage Outputs) but does not name the execution step itself.  In the TLA+
\* spec, ExecuteStage bridges the gap between "feature is running with lock"
\* and "stage N is marked complete" — it is the action that increments
\* lastCompleted for stages that do not require a debate phase.
\* Traces to BDD: "Mark a stage as complete" / "Mark multiple stages in order"
ExecuteStage(f, s) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ s = NextStage(f)
    /\ s \in 1..MaxStage
    /\ s /= MaxStage              \* Stage 7 handled separately
    /\ ~StageNeedsDebate(s)       \* No debate needed
    /\ lastCompleted' = [lastCompleted EXCEPT ![f] = s]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Start a debate for a stage that needs one.
\* BDD: "Write first debate round" -- inserts round 1 with consensus_status.
StartDebate(f, s) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ s = NextStage(f)
    /\ s \in 1..MaxStage
    /\ StageNeedsDebate(s)
    /\ debateConsensus[f][s] = "none"
    /\ debateRound' = [debateRound EXCEPT ![f][s] = 1]
    /\ debateConsensus' = [debateConsensus EXCEPT ![f][s] = "pending"]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, tierStatus, tierTasksDone, gateVerdict,
                   mergeStatus>>

\* Advance debate round (moderator determines no consensus yet).
\* BDD: "Write subsequent debate rounds"
AdvanceDebateRound(f, s) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ s = NextStage(f)           \* Explicit stage guard (Revision 4)
    /\ debateConsensus[f][s] = "pending"
    /\ debateRound[f][s] < MaxDebateRound
    /\ debateRound' = [debateRound EXCEPT ![f][s] = debateRound[f][s] + 1]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Debate reaches consensus -- stage completes.
\* BDD: consensus_status "CONSENSUS_REACHED"
DebateReachConsensus(f, s) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ s = NextStage(f)           \* Explicit stage guard (Revision 4)
    /\ debateConsensus[f][s] = "pending"
    /\ debateConsensus' = [debateConsensus EXCEPT ![f][s] = "reached"]
    /\ lastCompleted' = [lastCompleted EXCEPT ![f] = s]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus,
                   lockHolder, crashCount,
                   pipelineState, debateRound,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Debate fails (max rounds exhausted without consensus) -- feature halts.
\* BDD: "Debate fails when max rounds exhausted without consensus"
DebateFails(f, s) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ s = NextStage(f)           \* Explicit stage guard (Revision 4)
    /\ debateConsensus[f][s] = "pending"
    /\ debateRound[f][s] = MaxDebateRound
    /\ debateConsensus' = [debateConsensus EXCEPT ![f][s] = "failed"]
    /\ featureStatus' = [featureStatus EXCEPT ![f] = "halted"]
    /\ pipelineState' = [pipelineState EXCEPT ![f] = "halted"]
    /\ UNCHANGED <<dbOpen, activeFeature, lastCompleted,
                   lockHolder, crashCount,
                   debateRound,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

(**************************************************************************)
(* STAGE 7: CODING (tiers, tasks, merges, gates)                          *)
(**************************************************************************)

\* Enter Stage 7: initialize ALL tiers as "pending".
\* BDD: "Initialize all tiers to pending on Stage 7 entry"
\*
\* BULK INITIALIZATION (D8 -- Revision 6):
\* Previous revisions initialized only the first (MinTier) tier.  The BDD
\* explicitly shows all tiers initialized to "pending" in a single step.
\* Sequential execution ordering is enforced by StartTier's guard (D13),
\* not by deferred initialization.
\*
\* CRASH-RESUME NOTE (Revision 8):
\* This action is the INITIAL entry into Stage 7.  After a mid-Stage-7 crash,
\* this action is permanently blocked because crash recovery preserves tier
\* state (running→pending, passed/failed unchanged), so the guard
\* \A t \in Tiers : tierStatus[f][t] = "none" is unsatisfiable.
\* Resume after a mid-Stage-7 crash proceeds via StartTier, not EnterStage7.
\* See CRASH-RESUME-MID-STAGE-7 PATH in ProcessCrash for the full resume path.
EnterStage7(f) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ NextStage(f) = MaxStage
    /\ \A t \in Tiers : tierStatus[f][t] = "none"
    /\ tierStatus' = [tierStatus EXCEPT ![f] =
           [t \in Tiers |-> "pending"]]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierTasksDone, gateVerdict, mergeStatus>>

\* Start running a tier: pending -> running.
\* BDD: "Start a tier transitions from pending to running"
\*      "Advance to next tier after gate pass"
\*
\* SEQUENTIAL GUARD (D13 -- Revision 6):
\* All tiers with a lower number must have passed before this tier can start.
\* This replaces the previous AdvanceTier action, eliminating the circular
\* dependency between AdvanceTier's enabling condition and S12.  The guard
\* is a direct expression of the sequential-tier invariant, making the
\* relationship explicit rather than emergent.
\*
\* CRASH-RESUME ENTRY POINT (Revision 8):
\* After a mid-Stage-7 crash, this is the action that resumes tier execution.
\* The crashed running tier was reset to "pending" by ProcessCrash, so it
\* satisfies this action's guard.  Earlier tiers that already passed remain
\* "passed", satisfying the sequential predecessor check.
StartTier(f, t) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ tierStatus[f][t] = "pending"
    /\ \A t2 \in Tiers : t2 < t => tierStatus[f][t2] = "passed"
    /\ tierStatus' = [tierStatus EXCEPT ![f][t] = "running"]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierTasksDone, gateVerdict, mergeStatus>>

\* Complete a task within a running tier.
\* BDD: "Set a task result" -- upserts into task_results
CompleteTask(f, t) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ tierStatus[f][t] = "running"
    /\ tierTasksDone[f][t] < MaxTasks
    /\ tierTasksDone' = [tierTasksDone EXCEPT ![f][t] = tierTasksDone[f][t] + 1]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, gateVerdict, mergeStatus>>

\* Start a merge after tasks complete within a tier.
\* BDD: "Record a successful merge" -- inserts into merge_results
\* Merges aggregate workspace changes from completed tasks back to the
\* feature branch.  A merge must happen before gate evaluation.
StartMerge(f, t) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ tierStatus[f][t] = "running"
    /\ tierTasksDone[f][t] > 0      \* At least one task to merge
    /\ mergeStatus[f][t] = "none"
    /\ mergeStatus' = [mergeStatus EXCEPT ![f][t] = "pending"]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict>>

\* Merge succeeds -- workspace changes integrated cleanly.
\* BDD: "Record a successful merge" with status "success"
CompleteMerge(f, t) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ tierStatus[f][t] = "running"
    /\ mergeStatus[f][t] = "pending"
    /\ mergeStatus' = [mergeStatus EXCEPT ![f][t] = "merged"]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict>>

\* Merge conflict detected -- feature halts.
\* BDD: "Record a merge with conflict" with status "conflict"
\* A merge conflict is unrecoverable within the automated pipeline;
\* manual intervention is required to resolve conflicts.
MergeConflict(f, t) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ tierStatus[f][t] = "running"
    /\ mergeStatus[f][t] = "pending"
    /\ mergeStatus' = [mergeStatus EXCEPT ![f][t] = "conflict"]
    /\ tierStatus' = [tierStatus EXCEPT ![f][t] = "failed"]
    /\ featureStatus' = [featureStatus EXCEPT ![f] = "halted"]
    /\ pipelineState' = [pipelineState EXCEPT ![f] = "halted"]
    /\ UNCHANGED <<dbOpen, activeFeature, lastCompleted,
                   lockHolder, crashCount,
                   debateRound, debateConsensus,
                   tierTasksDone, gateVerdict>>

\* Gate passes for a tier: running -> passed.
\* BDD: "Record a gate result" with status "pass"
\*
\* GATE FAIRNESS NOTE (Revision 4):
\* Both GatePass and GateFail have weak fairness (WF) and share the same
\* enabling condition (running tier with completed tasks and no prior verdict).
\* This is intentional non-determinism: in the real system, the gate reviewer
\* (Claude agent) may pass or fail — we cannot predict which.  WF on both
\* means TLC explores BOTH outcomes from every gate-eligible state.  This is
\* sound because:
\*   (a) They are mutually exclusive in execution (gateVerdict guards "none")
\*   (b) WF only guarantees "if continuously enabled, eventually taken" --
\*       once one fires it disables the other via gateVerdict' /= "none"
\*   (c) The non-determinism in Next already ensures both are explored;
\*       WF ensures neither is starved in infinite runs
GatePass(f, t) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ tierStatus[f][t] = "running"
    /\ tierTasksDone[f][t] > 0      \* At least one task completed
    /\ mergeStatus[f][t] = "merged" \* Merge must succeed before gate
    /\ gateVerdict[f][t] = "none"
    /\ gateVerdict' = [gateVerdict EXCEPT ![f][t] = "pass"]
    /\ tierStatus' = [tierStatus EXCEPT ![f][t] = "passed"]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus, lastCompleted,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierTasksDone, mergeStatus>>

\* Gate fails for a tier -- feature halts.
\* BDD: "Gate failure halts the feature"
\* Guard: at least one task must have been completed before the gate
\* can evaluate -- gates assess completed work (consistent with GatePass).
\* BDD: "Gate cannot evaluate before any tasks complete"
\* See GATE FAIRNESS NOTE above for WF justification.
GateFail(f, t) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ tierStatus[f][t] = "running"
    /\ tierTasksDone[f][t] > 0      \* Gate evaluates completed work
    /\ mergeStatus[f][t] = "merged" \* Merge must succeed before gate
    /\ gateVerdict[f][t] = "none"
    /\ gateVerdict' = [gateVerdict EXCEPT ![f][t] = "fail"]
    /\ tierStatus' = [tierStatus EXCEPT ![f][t] = "failed"]
    /\ featureStatus' = [featureStatus EXCEPT ![f] = "halted"]
    /\ pipelineState' = [pipelineState EXCEPT ![f] = "halted"]
    /\ UNCHANGED <<dbOpen, activeFeature, lastCompleted,
                   lockHolder, crashCount,
                   debateRound, debateConsensus,
                   tierTasksDone, mergeStatus>>

\* Stage 7 complete: all tiers passed their gates.
\* BDD: all tiers passed → stage complete → pipeline can finish
CompleteStage7(f) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ NextStage(f) = MaxStage
    /\ AllTiersPassed(f)
    /\ lastCompleted' = [lastCompleted EXCEPT ![f] = MaxStage]
    /\ UNCHANGED <<dbOpen, activeFeature, featureStatus,
                   lockHolder, crashCount,
                   pipelineState, debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

(**************************************************************************)
(* PIPELINE COMPLETION                                                    *)
(**************************************************************************)

\* Feature completes successfully (all stages done).
CompletePipeline(f) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ AllStagesDone(f)
    /\ featureStatus' = [featureStatus EXCEPT ![f] = "complete"]
    /\ pipelineState' = [pipelineState EXCEPT ![f] = "complete"]
    /\ UNCHANGED <<dbOpen, activeFeature, lastCompleted,
                   lockHolder, crashCount,
                   debateRound, debateConsensus,
                   tierStatus, tierTasksDone, gateVerdict, mergeStatus>>

\* Feature halted by user or fail-fast error.
\* BDD: "Any DB query failure throws a terminating error"
\* Elicitor: "user ability to stop the pipeline at any point manually"
\*
\* IMPORTANT: Any pending debate must be marked "failed" on halt.
\* Otherwise a pending debate becomes orphaned -- DebateReachConsensus and
\* DebateFails both guard on IsRunning(f), so once halted no action can
\* ever resolve the debate, violating the DebateTermination liveness
\* property.  ProcessCrash does NOT do this because crash-recovery
\* preserves debate state for resume (feature returns to "idle").
\*
\* HALT TIER CLEANUP (Revision 4):
\* Running tiers must be marked "failed" on halt.  Without this, a running
\* tier in a halted feature has no resolution path -- no action can
\* transition it (all tier actions guard IsRunning(f)).  This creates an
\* inconsistent terminal state visible in the database.
\*
\* PRE-STATE EVALUATION SEMANTICS (D4 -- Revision 6):
\* The mergeStatus cleanup below reads tierStatus[f][t] (the PRE-state value)
\* to decide which merges to reset, while tierStatus' is being computed
\* simultaneously in the same action.  This is CORRECT in TLA+ because all
\* primed expressions in an action evaluate against the successor state,
\* while unprimed expressions evaluate against the current state.  The
\* merge cleanup condition (tierStatus[f][t] = "running") matches exactly
\* the tiers being transitioned by the tierStatus' expression above.
\* However, this coupling is FRAGILE: if the tierStatus cleanup condition
\* were changed (e.g., to also reset "pending" tiers), the mergeStatus
\* condition would need a matching update.  Any future revision must keep
\* these two conditions synchronized.
\*
\* FRAGILITY VALIDATED (Revision 7): tierStatus now also resets "pending"
\* tiers to "none".  mergeStatus needs NO update because pending tiers
\* cannot have mergeStatus /= "none" — StartMerge requires tierStatus =
\* "running", so a pending tier never enters the merge lifecycle.
\*
\* NOTE: This action has NO fairness (not in the Fairness formula).
\* Halting is a user-initiated or error-triggered event, not a system
\* guarantee.  If HaltPipeline had WF, it would be continuously enabled
\* for the entire pipeline run (no progress action disables it), forcing
\* every feature to halt and making completion unreachable.
\*
\* DOMAIN RULE (Revision 12 — OBJ-2):
\* The conceptual justification for atomic cross-aggregate writes is:
\* "Halting is an irreversible atomic event that closes ALL open work."
\* The domain requires this because halted is a TERMINAL state — once a
\* feature halts, no automated action can resume it (only operator
\* intervention via a new feature).  If halting were split into steps:
\*   - featureStatus="halted" without failing pending debates → orphaned
\*     debates that no action can resolve (DebateReachConsensus and
\*     DebateFails both guard IsRunning(f)), violating L2 DebateTermination
\*   - featureStatus="halted" without cleaning up running tiers → tiers
\*     stuck in "running" with no path to resolution (all tier actions
\*     guard IsRunning(f)), violating S16 HaltedNoRunningTiers
\*   - pipelineState left as "running" while featureStatus="halted" →
\*     database inconsistency visible to queries, violating S5
\* The domain rule "halt closes everything" mandates that all cleanup
\* happens in the same atomic step as the status transition.
HaltPipeline(f) ==
    /\ dbOpen
    /\ lockHolder = f
    /\ IsRunning(f)
    /\ featureStatus' = [featureStatus EXCEPT ![f] = "halted"]
    /\ pipelineState' = [pipelineState EXCEPT ![f] = "halted"]
    \* Fail any pending debates (prevent orphaned debate state)
    /\ debateConsensus' = [debateConsensus EXCEPT ![f] =
           [s \in 1..MaxStage |->
               IF debateConsensus[f][s] = "pending"
               THEN "failed"
               ELSE debateConsensus[f][s]]]
    \* Clean up running and pending tiers on halt.
    \* Running tiers with completed tasks are marked "failed" (work was done
    \* but not gate-evaluated).  Running tiers with zero tasks are reset to
    \* "none" (no work was produced; "failed" would violate TierFailRequiresTasks).
    \* Pending tiers are reset to "none" — no work was started, so there is
    \* nothing to preserve.  Without this, a taskless running tier resetting
    \* to "none" while a later pending tier remains "pending" would violate
    \* TierSequentialOrder Part B (activation ordering).
    \* (Revision 7 fix — addresses S12 violation found by TLC.)
    /\ tierStatus' = [tierStatus EXCEPT ![f] =
           [t \in Tiers |->
               IF tierStatus[f][t] = "running"
               THEN IF tierTasksDone[f][t] > 0 THEN "failed" ELSE "none"
               ELSE IF tierStatus[f][t] = "pending"
               THEN "none"
               ELSE tierStatus[f][t]]]
    \* Reset pending merges on failed tiers.
    \* Uses tierStatus (pre-state) -- see PRE-STATE EVALUATION note above.
    /\ mergeStatus' = [mergeStatus EXCEPT ![f] =
           [t \in Tiers |->
               IF tierStatus[f][t] = "running" /\ mergeStatus[f][t] = "pending"
               THEN "none"
               ELSE mergeStatus[f][t]]]
    /\ UNCHANGED <<dbOpen, activeFeature, lastCompleted,
                   lockHolder, crashCount,
                   debateRound,
                   tierTasksDone, gateVerdict>>

(**************************************************************************)
(* NEXT-STATE RELATION                                                    *)
(**************************************************************************)

Next ==
    \/ OpenDatabase
    \/ CloseDatabase
    \/ ClearActiveFeature
    \/ \E f \in Features :
        \/ CreateFeature(f)
        \/ SetActiveFeature(f)
        \/ AcquireLock(f)
        \/ ReleaseLock(f)
        \/ ForceUnlock(f)
        \/ ProcessCrash(f)
        \/ CompletePipeline(f)
        \/ HaltPipeline(f)
        \/ EnterStage7(f)
        \/ CompleteStage7(f)
        \/ \E s \in 1..MaxStage :
            \/ ExecuteStage(f, s)
            \/ StartDebate(f, s)
            \/ AdvanceDebateRound(f, s)
            \/ DebateReachConsensus(f, s)
            \/ DebateFails(f, s)
        \/ \E t \in Tiers :
            \/ StartTier(f, t)
            \/ CompleteTask(f, t)
            \/ StartMerge(f, t)
            \/ CompleteMerge(f, t)
            \/ MergeConflict(f, t)
            \/ GatePass(f, t)
            \/ GateFail(f, t)

(**************************************************************************)
(* FAIRNESS                                                               *)
(**************************************************************************)

\* Fairness conditions.
\*
\* EXCLUDED from fairness (external/non-deterministic events):
\*   - ProcessCrash:  faults are not guaranteed to happen
\*   - HaltPipeline:  user-initiated stop; if given WF, it is continuously
\*                     enabled while a feature runs (no progress action
\*                     disables it), so WF would force every feature to
\*                     halt, making completion unreachable
\*   - MergeConflict:  environmental non-determinism (like ProcessCrash);
\*                      conflicts are possible but not guaranteed
\*   - ForceUnlock:   operator-initiated manual intervention; not an
\*                     automated system guarantee (like HaltPipeline)
\*
\* SetActiveFeature uses STRONG fairness (SF): after a crash-recovery cycle the
\* DB may close and reopen repeatedly, so SetActiveFeature is only *infinitely
\* often* enabled (not continuously).  WF would allow a CloseDatabase/OpenDatabase
\* lasso to starve it forever.  SF guarantees that if the action is infinitely
\* often enabled it eventually fires, breaking the lasso and letting the pipeline
\* resume.
\*
\* SINGLE-FEATURE SF NOTE (D5 -- Revision 6):
\* When |Features|=1, the SF on SetActiveFeature and AcquireLock may appear
\* over-specified because there is no multi-feature interleaving to create
\* the flip-flop lasso.  However, SF is still necessary even with one feature:
\* after a crash recovery, the cycle OpenDatabase → SetActiveFeature →
\* AcquireLock is interrupted by the DB close/reopen that crash recovery
\* triggers.  SetActiveFeature is only enabled while dbOpen=TRUE and the
\* feature is idle — these windows are intermittent, not continuous, so WF
\* would not guarantee eventual firing.  SF correctly handles this regardless
\* of |Features|.
\*
\* AcquireLock also uses STRONG fairness (SF): when multiple idle features
\* compete, SetActiveFeature can flip activeFeature between them each step.
\* AcquireLock(f) requires activeFeature = f, so it is enabled only while f
\* is the active feature -- intermittently, not continuously.  WF would allow
\* a SetActiveFeature flip-flop lasso to starve lock acquisition forever.
\* SF breaks this: if AcquireLock(f) is infinitely often enabled (because
\* activeFeature is infinitely often set to f), it must eventually fire.
\*
\* GATE PASS/FAIL FAIRNESS:
\* Both GatePass and GateFail have WF.  See GATE FAIRNESS NOTE above
\* (in the GatePass action) for detailed justification of why this is sound.
Fairness ==
    /\ WF_vars(OpenDatabase)
    /\ WF_vars(CloseDatabase)
    /\ WF_vars(ClearActiveFeature)
    /\ \A f \in Features :
        /\ WF_vars(CreateFeature(f))
        /\ SF_vars(SetActiveFeature(f))   \* Strong fairness -- see note above
        /\ SF_vars(AcquireLock(f))        \* Strong fairness -- see note above
        /\ WF_vars(ReleaseLock(f))
        /\ WF_vars(CompletePipeline(f))
        \* HaltPipeline deliberately omitted -- see note above
        \* ForceUnlock deliberately omitted -- see note above
        /\ WF_vars(EnterStage7(f))
        /\ WF_vars(CompleteStage7(f))
        /\ \A s \in 1..MaxStage :
            /\ WF_vars(ExecuteStage(f, s))
            /\ WF_vars(StartDebate(f, s))
            /\ WF_vars(AdvanceDebateRound(f, s))
            /\ WF_vars(DebateReachConsensus(f, s))
            /\ WF_vars(DebateFails(f, s))
        /\ \A t \in Tiers :
            /\ WF_vars(StartTier(f, t))
            /\ WF_vars(CompleteTask(f, t))
            /\ WF_vars(StartMerge(f, t))
            /\ WF_vars(CompleteMerge(f, t))
            \* MergeConflict deliberately omitted -- see note above
            /\ WF_vars(GatePass(f, t))
            /\ WF_vars(GateFail(f, t))

(**************************************************************************)
(* SPECIFICATION                                                          *)
(**************************************************************************)

Spec == Init /\ [][Next]_vars /\ Fairness

(**************************************************************************)
(* SAFETY PROPERTIES (invariants -- must hold in every reachable state)   *)
(**************************************************************************)

\* S1: At most one feature can be "running" at any time.
\* Enforced by system mutex + single active feature session row.
SingleRunningFeature ==
    \A f1, f2 \in Features :
        (featureStatus[f1] = "running" /\ featureStatus[f2] = "running")
            => f1 = f2

\* S2: Lock is exclusive -- one holder, and that holder must be running, halted, or complete.
\* "complete" is valid because CompletePipeline sets featureStatus before ReleaseLock clears lockHolder.
LockExclusive ==
    lockHolder /= NULL =>
        /\ lockHolder \in Features
        /\ featureStatus[lockHolder] \in {"running", "halted", "complete"}

\* S3: REMOVED (Revision 10, OBJ-1)
\* StageMonotonic previously asserted lastCompleted[f] \in 0..MaxStage — identical
\* to the TypeOK range constraint.  The name was misleading: "monotonic" implies
\* ordering semantics, but the predicate was only a range bound.  True monotonicity
\* is provided by L6 (StageNeverDecreases), the temporal property that asserts
\* lastCompleted never decreases across steps.  Removing S3 eliminates the
\* redundancy without losing any verification coverage:
\*   - Range bound: TypeOK (lastCompleted[f] \in 0..MaxStage)
\*   - Monotonicity: L6 StageNeverDecreases ([][lastCompleted' >= lastCompleted]_vars)

\* S4: Feature completion requires all MaxStage stages done.
NoCompletionWithoutAllStages ==
    \A f \in Features :
        featureStatus[f] = "complete" => lastCompleted[f] = MaxStage

\* S5: Halted feature has consistent pipeline state.
HaltedStateConsistent ==
    \A f \in Features :
        featureStatus[f] = "halted" => pipelineState[f] = "halted"

\* S6: A passed tier must have at least one completed task.
TierPassRequiresTasks ==
    \A f \in Features :
        \A t \in Tiers :
            tierStatus[f][t] = "passed" => tierTasksDone[f][t] > 0

\* S7: Gate verdict is consistent with tier status.
GateVerdictConsistent ==
    \A f \in Features :
        \A t \in Tiers :
            /\ (gateVerdict[f][t] = "pass" => tierStatus[f][t] = "passed")
            /\ (gateVerdict[f][t] = "fail" => tierStatus[f][t] = "failed")

\* S8: Active feature must exist in the features table.
\* BDD: session tracks a feature that was created via New-Feature.
ActiveFeatureMustExist ==
    activeFeature /= NULL => featureStatus[activeFeature] /= "none"

\* S9: A running feature always holds the lock.
\* This is the core mutex invariant -- running means you own the lock.
RunningImpliesLockHeld ==
    \A f \in Features :
        featureStatus[f] = "running" => lockHolder = f

\* S10: Database must be open for any feature to be active.
\* BDD: "subsequent repository calls fail with a connection error until
\*       Open-StateDatabase is called again"
DbOpenWhenActive ==
    activeFeature /= NULL => dbOpen

\* S11: Debate consensus values are consistent with stage type and position.
\* EXTENDED (OBJ-2, Revision 9): Previously only constrained "pending" consensus.
\* Now constrains ALL non-"none" values:
\*   - Any non-"none" consensus requires a debate stage (prevents "reached"/"failed"
\*     on non-debate stages like stage 1 or MaxStage)
\*   - "pending" additionally requires s = NextStage(f) (active debate must be
\*     the current stage; "reached"/"failed" are terminal and the stage has
\*     already advanced past them)
\* Without the non-"none" → StageNeedsDebate constraint, a regression could
\* set debateConsensus = "reached" on stage 1 (no-debate stage) without any
\* invariant catching the inconsistency.
DebateStageConsistency ==
    \A f \in Features :
        \A s \in 1..MaxStage :
            \* All non-"none" consensus values require a debate-eligible stage
            /\ (debateConsensus[f][s] /= "none" => StageNeedsDebate(s))
            \* Active ("pending") debate must be the current stage
            /\ (debateConsensus[f][s] = "pending" => s = NextStage(f))

\* S12: Tier ordering — sequential execution and activation.
\* Part A: a later tier cannot be running/passed/failed unless all earlier
\*         tiers have passed.  (Original invariant.)
\* Part B (D6 -- Revision 6): a later tier cannot be activated (not "none")
\*         unless all earlier tiers are also activated.  This closes the gap
\*         where "pending" tiers were unconstrained.  With bulk initialization
\*         (D8), all tiers transition from "none" to "pending" atomically in
\*         EnterStage7, so Part B is trivially satisfied at initialization.
\*         After crash recovery, a running tier resets to "pending" while its
\*         predecessors remain "passed" — also satisfying Part B.
\*         After halt, all non-terminal tiers (running and pending) reset to
\*         "none" atomically (Revision 7), preserving Part B.
TierSequentialOrder ==
    \A f \in Features :
        \A t1, t2 \in Tiers :
            t1 < t2 =>
                \* Part A: execution ordering
                /\ (tierStatus[f][t2] \in {"running", "passed", "failed"} =>
                        tierStatus[f][t1] = "passed")
                \* Part B: activation ordering
                /\ (tierStatus[f][t2] /= "none" =>
                        tierStatus[f][t1] /= "none")

\* S13: A failed tier must have at least one completed task.
\* Gate evaluation requires work to evaluate -- consistent with S6 for passed tiers.
\* HaltPipeline enforces this by resetting taskless running tiers to "none"
\* rather than "failed" (Revision 5 fix).
TierFailRequiresTasks ==
    \A f \in Features :
        \A t \in Tiers :
            tierStatus[f][t] = "failed" => tierTasksDone[f][t] > 0

\* S14: Merge status is consistent with tier status.
\* A merged result requires a running or later-stage tier; a conflict implies failure.
MergeStatusConsistent ==
    \A f \in Features :
        \A t \in Tiers :
            /\ (mergeStatus[f][t] = "conflict" => tierStatus[f][t] = "failed")
            /\ (mergeStatus[f][t] = "merged" =>
                    tierStatus[f][t] \in {"running", "passed", "failed"})
            /\ (mergeStatus[f][t] = "pending" =>
                    tierStatus[f][t] = "running")

\* S15: Gate evaluation requires a successful merge.
\* Gates assess the merged result -- they cannot evaluate before merge completes.
GateRequiresMerge ==
    \A f \in Features :
        \A t \in Tiers :
            gateVerdict[f][t] /= "none" => mergeStatus[f][t] = "merged"

\* S16: A halted feature has no running tiers.
\* HaltPipeline and GateFail/MergeConflict both clean up running tiers on halt.
HaltedNoRunningTiers ==
    \A f \in Features :
        featureStatus[f] = "halted" =>
            \A t \in Tiers : tierStatus[f][t] /= "running"

\* S17 (D1 -- Revision 6): Running feature has consistent pipeline state.
\* Complements S5 (halted) — ensures pipelineState tracks featureStatus
\* for the "running" case, not just "halted".
RunningStateConsistent ==
    \A f \in Features :
        featureStatus[f] = "running" => pipelineState[f] = "running"

\* S18 (D1 -- Revision 6): Complete feature has consistent pipeline state.
\* Complements S5 (halted) and S17 (running) — ensures pipelineState
\* tracks featureStatus for the "complete" case.
CompleteStateConsistent ==
    \A f \in Features :
        featureStatus[f] = "complete" => pipelineState[f] = "complete"

\* S19 (Revision 8): Idle feature has consistent pipeline state.
\* Completes the full pipelineState/featureStatus sync coverage:
\*   S5  — halted  => pipelineState = "halted"
\*   S17 — running => pipelineState = "running"
\*   S18 — complete => pipelineState = "complete"
\*   S19 — idle    => pipelineState = "none"
\* After crash recovery, ProcessCrash resets a running feature to "idle" and
\* pipelineState to "none" atomically.  Without this invariant, a regression
\* in ProcessCrash could leave pipelineState = "running" while the feature is
\* idle — an inconsistent database state where the pipeline_state table claims
\* a run is in progress but the features table shows the feature is dormant.
\* The "none" status (rather than "idle") is used because the pipeline_state
\* table has no "idle" value — it only tracks active pipeline execution.
\*
\* NOTE: featureStatus = "none" (feature not yet created) is constrained
\* separately by S23 (NoneStateConsistent, Revision 12), which asserts
\* pipelineState = "none" when featureStatus = "none".
IdleStateConsistent ==
    \A f \in Features :
        featureStatus[f] = "idle" => pipelineState[f] = "none"

\* S20 (OBJ-4 -- Revision 9): Crash budget is formally enforced.
\* When crashCount reaches MaxCrashes, ProcessCrash must be disabled for that
\* feature.  Previously this was only documented in prose (MAX CRASHES EXCEEDED
\* behavioral note).  The ENABLED operator verifies that the action's enabling
\* condition (including crashCount[f] < MaxCrashes) is actually unsatisfied.
\* This catches regressions where a code change might accidentally allow
\* ProcessCrash to fire beyond the budget.
\*
\* PERFORMANCE NOTE (Revision 12 — OBJ-4):
\* ENABLED ProcessCrash(f) requires TLC to evaluate the full enabling
\* condition of ProcessCrash for every reachable state and every f in
\* Features.  This is more expensive than a simple state predicate because
\* TLC must compute whether a successor state EXISTS (existential check
\* over all primed variables).  At the current .cfg bounds (Features={f1},
\* MaxCrashes=2) the overhead is negligible — the enabling condition is a
\* simple conjunction of state predicates.  However, scaling to larger
\* |Features| or higher MaxCrashes would multiply the cost linearly.
\* TAUTOLOGY WARNING (T3 — Revision 13):
\* Previous revisions suggested an "equivalent" non-ENABLED formulation:
\*   crashCount[f] >= MaxCrashes =>
\*     ~(dbOpen /\ lockHolder = f /\ crashCount[f] < MaxCrashes)
\* This is a TAUTOLOGY: the antecedent (crashCount[f] >= MaxCrashes) makes
\* crashCount[f] < MaxCrashes in the consequent always FALSE, so the negated
\* conjunction is always TRUE regardless of dbOpen and lockHolder.  The
\* implication is vacuously satisfied in every state.
\*
\* No simpler non-ENABLED equivalent exists because the crash budget guard
\* (crashCount[f] < MaxCrashes) IS part of ProcessCrash's enabling condition.
\* Any formulation that checks "ProcessCrash is disabled when budget exhausted"
\* must either use ENABLED or redundantly restate the guard, which collapses
\* to the same tautology.
\*
\* If TLC runtime becomes prohibitive at larger bounds, the recommended
\* mitigation is to REMOVE S20 entirely rather than replace it with a
\* tautology.  The crash budget is already enforced structurally:
\*   (a) TypeOK constrains crashCount[f] \in 0..MaxCrashes (range bound)
\*   (b) ProcessCrash guards crashCount[f] < MaxCrashes (action guard)
\* S20 adds regression protection (catches a future action that bypasses
\* the guard), but this value must be weighed against ENABLED cost at scale.
CrashBudgetEnforced ==
    \A f \in Features :
        crashCount[f] >= MaxCrashes => ~ENABLED ProcessCrash(f)

\* S21 (OBJ-3 -- Revision 10): A "none" tier has zero completed tasks.
\* Guards against orphaned task counts when a tier is reset to "none".
\* Currently correct by construction:
\*   - HaltPipeline resets taskless running tiers to "none" (tasks already 0)
\*   - HaltPipeline resets pending tiers to "none" (pending tiers never
\*     have tasks — CompleteTask requires tierStatus = "running")
\*   - Init sets all tiers to "none" with tasksDone = 0
\*   - No other action transitions a tier TO "none"
\* But unguarded against regressions where a future action resets a tier to
\* "none" without zeroing its task count (e.g., a "restart tier" feature).
\* Without this invariant, such a regression would only be caught indirectly
\* (if at all) via TierPassRequiresTasks or TierFailRequiresTasks when the
\* tier is later restarted — but if the tier is never restarted, the orphaned
\* count persists silently in the database.
NoneTierNoTasks ==
    \A f \in Features :
        \A t \in Tiers :
            tierStatus[f][t] = "none" => tierTasksDone[f][t] = 0

\* S22 (OBJ-4 -- Revision 10): A running tier has no gate verdict.
\* GatePass and GateFail atomically transition the tier OUT of "running"
\* (to "passed" or "failed") in the same action that sets the verdict.
\* This invariant makes that coupling EXPLICIT:
\*   - If tierStatus = "running", gateVerdict MUST be "none"
\*   - If gateVerdict /= "none", tierStatus MUST NOT be "running"
\*     (already covered by S7 GateVerdictConsistent, but S22 is the
\*     converse direction: status → verdict rather than verdict → status)
\* Without this, a regression that sets gateVerdict to "pass" or "fail"
\* WITHOUT transitioning the tier out of "running" would go undetected
\* by S7 (which checks verdict→status, not status→verdict).
RunningTierNoVerdict ==
    \A f \in Features :
        \A t \in Tiers :
            tierStatus[f][t] = "running" => gateVerdict[f][t] = "none"

\* S23 (Revision 12 — OBJ-3): Uncreated feature has consistent pipeline state.
\* Completes the FULL featureStatus↔pipelineState sync coverage:
\*   S5  — halted   => pipelineState = "halted"
\*   S17 — running  => pipelineState = "running"
\*   S18 — complete => pipelineState = "complete"
\*   S19 — idle     => pipelineState = "none"
\*   S23 — none     => pipelineState = "none"
\* Previously, featureStatus = "none" was only documented as trivially
\* correct by construction (no action sets pipelineState to a non-"none"
\* value without first creating the feature via CreateFeature).  This is
\* true for the current action set, but unguarded against regressions:
\*   - A future action that upserts into pipeline_state before features
\*     (e.g., a "pre-register pipeline" step) would silently break the
\*     invariant without any TLC failure unless explicitly constrained
\*   - An Init regression that initializes pipelineState to a non-"none"
\*     value while featureStatus remains "none" would go undetected
\* With S23, all five featureStatus domain values have explicit pipelineState
\* synchronization invariants — the denormalization contract is fully closed.
NoneStateConsistent ==
    \A f \in Features :
        featureStatus[f] = "none" => pipelineState[f] = "none"

\* PIPELINE STATE / FEATURE STATUS OVERLAP NOTE:
\* Both pipelineState and featureStatus carry running/halted/complete values.
\* S5, S17, S18, S19, and S23 together enforce COMPLETE synchronization
\* between them for ALL five featureStatus domain values:
\*   none     → pipelineState = "none"     (S23)
\*   idle     → pipelineState = "none"     (S19)
\*   running  → pipelineState = "running"  (S17)
\*   halted   → pipelineState = "halted"   (S5)
\*   complete → pipelineState = "complete" (S18)
\* No featureStatus value is unconstrained.  Any regression that breaks
\* the pipelineState↔featureStatus synchronization for ANY status value
\* will be caught by one of these five invariants.
\* Both variables exist because they model distinct database tables with
\* different column sets:
\*   - featureStatus: the features table (name, status, created_at)
\*   - pipelineState: the pipeline_state table (feature_name, pipeline_state,
\*     lock_holder, review_round, verdict, current_stage, etc.)
\* The pipeline_state table carries additional runtime columns (review_round,
\* verdict, current_stage, etc.) that are not modeled here — see
\* INTENTIONAL ABSTRACTION BOUNDARY in the module header.  The status overlap
\* is intentional denormalization in the real schema for query convenience.

(**************************************************************************)
(* LIVENESS PROPERTIES (temporal -- must eventually hold)                 *)
(**************************************************************************)

\* L1: A running feature eventually completes, halts, or resets to idle (crash).
EventualTermination ==
    \A f \in Features :
        featureStatus[f] = "running" ~>
            featureStatus[f] \in {"complete", "halted", "idle"}

\* L2: A pending debate eventually reaches consensus or fails.
DebateTermination ==
    \A f \in Features :
        \A s \in 1..MaxStage :
            debateConsensus[f][s] = "pending" ~>
                debateConsensus[f][s] \in {"reached", "failed"}

\* L3: If the database opens, it eventually closes (pipeline terminates).
\*
\* CONDITIONAL NATURE (D3 -- Revision 6):
\* This property assumes the pipeline can always make forward progress
\* after crash recovery.  If MaxCrashes is exhausted AND a real-world crash
\* occurs beyond the model's crash budget, the system requires manual
\* intervention (operator clears the stale lock via ForceUnlock).  The
\* model verifies L3 for up to MaxCrashes fault cycles.  With MaxCrashes=2
\* (see .cfg), this covers the realistic recovery scenario.
\*
\* Within the model, L3 is achievable because:
\*   (a) All progress actions have WF/SF, guaranteeing forward progress
\*   (b) ProcessCrash (up to MaxCrashes) resets to idle for resumption
\*   (c) Terminal paths (DebateFails, GateFail, MergeConflict) lead to halt
\*   (d) Halt/complete → ReleaseLock → ClearActiveFeature → CloseDatabase
\*       is a fair chain (all have WF)
\* If the system cannot crash (all crashes exhausted), it proceeds on the
\* crash-free happy path which always terminates.
DatabaseEventuallyCloses ==
    dbOpen ~> ~dbOpen

\* L4: If a lock is held, it is eventually released (by release or crash recovery).
LockEventuallyReleased ==
    lockHolder /= NULL ~> lockHolder = NULL

\* L5: A pending merge eventually resolves (merged or conflict or reset by crash).
\*
\* LIVENESS ANCHOR (Revision 8, corrected Revision 9 OBJ-5):
\* This property holds because WF(CompleteMerge) is the GUARANTEED resolution
\* mechanism.  While a merge is pending and the feature is running,
\* CompleteMerge is continuously enabled, and WF guarantees it eventually
\* fires — resolving the merge to "merged".
\*
\* Two ADDITIONAL resolution paths exist but are NOT guaranteed (no fairness):
\*   - MergeConflict (no fairness): may non-deterministically resolve the
\*     merge to "conflict" and halt the feature.  POSSIBLE but not guaranteed.
\*   - ProcessCrash (no fairness): resets pending merges to "none" for
\*     running tiers.  POSSIBLE but not guaranteed.
\* These unfair paths contribute to resolution IF they occur, but L5 does NOT
\* depend on them.  The property is unconditional (unlike L3) because
\* WF(CompleteMerge) alone is sufficient: it fires unless the feature halts
\* or crashes first — and both of those also resolve the merge:
\*   - HaltPipeline resets pending merges to "none" (cleanup logic)
\*   - ProcessCrash resets pending merges to "none" (crash recovery)
\* Thus every pending merge has at least one resolution path: the guaranteed
\* WF(CompleteMerge), or the incidental cleanup from halt/crash.
MergeEventuallyResolves ==
    \A f \in Features :
        \A t \in Tiers :
            mergeStatus[f][t] = "pending" ~>
                mergeStatus[f][t] \in {"merged", "conflict", "none"}

\* L6 (OBJ-6 -- Revision 9): Stage progression never decreases.
\* This is the sole monotonicity guarantee for lastCompleted (S3 removed
\* in Revision 10 as redundant with TypeOK; see S3 removal note above).
\* The [][]_vars form asserts that in every step, either the action preserves
\* or increases lastCompleted — no action may regress it.  This makes
\* monotonicity EXPLICIT rather than emergent from action guards.
\*
\* Verification value: catches regressions where a new action accidentally
\* resets lastCompleted (e.g., a future "restart stage" feature that zeroes
\* progress).  Without this, such a regression would only be caught indirectly
\* if it caused a downstream invariant violation.
StageNeverDecreases ==
    [][\A f \in Features : lastCompleted'[f] >= lastCompleted[f]]_vars

=============================================================================
