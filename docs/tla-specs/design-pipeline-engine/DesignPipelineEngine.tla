----------------------- MODULE DesignPipelineEngine -----------------------
\* Design Pipeline TypeScript Engine — Pipeline Lifecycle State Machine
\* Models the 6-phase sequential pipeline with forward transitions,
\* backward transitions, retry budgets, validation failures, and accumulated context.
\*
\* Source: docs/superpowers/specs/2026-04-01-design-pipeline-ts-engine-design.md
\* Debate:  docs/debate-moderator-sessions/2026-04-01_design-pipeline-ts-engine.md
\* Review:  docs/debate-moderator-sessions/2026-04-01_design-pipeline-ts-engine-tla-review.md
\*
\* Revision 1 — addresses 2 HIGH and 3 MEDIUM objections from TLA+ review debate.

EXTENDS Integers, FiniteSets, TLC

CONSTANTS
    MaxPipelineRetries,       \* Maximum retries per phase (default 3)
    MaxValidationAttempts,    \* Maximum validation failures per phase before forced halt
    Experts                   \* Set of expert names, e.g. {"tdd","ddd","tla","edge"}

-----------------------------------------------------------------------------
\* Phase Enumeration
-----------------------------------------------------------------------------

Phases == {
    "IDLE",
    "PHASE_1_QUESTIONER",
    "PHASE_2_DESIGN_DEBATE",
    "PHASE_3_TLA_WRITER",
    "PHASE_4_TLA_REVIEW",
    "PHASE_5_IMPLEMENTATION",
    "PHASE_6_PAIR_PROGRAMMING",
    "COMPLETE",
    "HALTED"
}

TerminalPhases == { "COMPLETE", "HALTED" }

NonTerminalPhases == Phases \ TerminalPhases

\* Phases where agents produce output that goes through the two-pass validator.
\* IDLE has no agent output; PHASE_6 produces code (not tracked as a pipeline
\* artifact path); COMPLETE and HALTED are terminal.
ValidatedPhases == {
    "PHASE_1_QUESTIONER",
    "PHASE_2_DESIGN_DEBATE",
    "PHASE_3_TLA_WRITER",
    "PHASE_4_TLA_REVIEW",
    "PHASE_5_IMPLEMENTATION"
}

\* Artifact names produced by each phase
ArtifactNames == {
    "briefingPath",
    "designConsensusPath",
    "tlaSpecPath",
    "tlcResult",
    "tlaReviewPath",
    "implementationPlanPath"
}

\* Which phase produces which artifacts
ArtifactsProducedBy(p) ==
    CASE p = "PHASE_1_QUESTIONER"        -> {"briefingPath"}
      [] p = "PHASE_2_DESIGN_DEBATE"     -> {"designConsensusPath"}
      [] p = "PHASE_3_TLA_WRITER"        -> {"tlaSpecPath", "tlcResult"}
      [] p = "PHASE_4_TLA_REVIEW"        -> {"tlaReviewPath"}
      [] p = "PHASE_5_IMPLEMENTATION"    -> {"implementationPlanPath"}
      [] OTHER                           -> {}

\* Phases that are backward-transition targets
RetryablePhases == { "PHASE_1_QUESTIONER", "PHASE_3_TLA_WRITER" }

\* Phase ordering for comparison
PhaseOrd(p) ==
    CASE p = "IDLE"                      -> 0
      [] p = "PHASE_1_QUESTIONER"        -> 1
      [] p = "PHASE_2_DESIGN_DEBATE"     -> 2
      [] p = "PHASE_3_TLA_WRITER"        -> 3
      [] p = "PHASE_4_TLA_REVIEW"        -> 4
      [] p = "PHASE_5_IMPLEMENTATION"    -> 5
      [] p = "PHASE_6_PAIR_PROGRAMMING"  -> 6
      [] p = "COMPLETE"                  -> 7
      [] p = "HALTED"                    -> 8

\* All artifacts that should exist when at-or-past a given phase.
\* Used in the ArtifactPreservation invariant to verify that backward
\* transitions preserve artifacts outside their clear set.
ArtifactsCumulativeUpTo(p) ==
    UNION { ArtifactsProducedBy(q) : q \in { r \in Phases : PhaseOrd(r) >= 1 /\ PhaseOrd(r) <= PhaseOrd(p) - 1 } }

-----------------------------------------------------------------------------
\* Variables
-----------------------------------------------------------------------------

VARIABLES
    phase,                \* Current pipeline phase
    artifacts,            \* Set of artifact names that have been produced
    experts_selected,     \* Set of experts chosen in PHASE_1 (empty until then)
    retries,              \* Function: RetryablePhases -> 0..MaxPipelineRetries
    haltReason,           \* "NONE" or a halt reason string
    locked,               \* Whether the pipeline lock is held
    validationAttempts    \* Per-phase counter: how many times validation has failed
                          \* for the current phase (reset on successful forward transition)

vars == <<phase, artifacts, experts_selected, retries, haltReason, locked, validationAttempts>>

-----------------------------------------------------------------------------
\* Type Invariant
-----------------------------------------------------------------------------

TypeOK ==
    /\ phase \in Phases
    /\ artifacts \subseteq ArtifactNames
    /\ experts_selected \subseteq Experts
    /\ retries \in [RetryablePhases -> 0..MaxPipelineRetries]
    /\ haltReason \in {"NONE", "RETRY_EXHAUSTED", "USER_HALT", "AGENT_FAILURE", "VALIDATION_EXHAUSTED"}
    /\ locked \in BOOLEAN
    /\ validationAttempts \in 0..MaxValidationAttempts

-----------------------------------------------------------------------------
\* Initial State
-----------------------------------------------------------------------------

Init ==
    /\ phase = "IDLE"
    /\ artifacts = {}
    /\ experts_selected = {}
    /\ retries = [p \in RetryablePhases |-> 0]
    /\ haltReason = "NONE"
    /\ locked = FALSE
    /\ validationAttempts = 0

-----------------------------------------------------------------------------
\* Forward Transitions
\*
\* Each forward transition represents "the agent produced output AND it passed
\* the two-pass validator (structural + heuristic)." On success the validation
\* attempt counter is reset to 0.
-----------------------------------------------------------------------------

\* IDLE -> PHASE_1: unconditional, acquires lock
StartPipeline ==
    /\ phase = "IDLE"
    /\ locked = FALSE
    /\ phase' = "PHASE_1_QUESTIONER"
    /\ locked' = TRUE
    /\ validationAttempts' = 0
    /\ UNCHANGED <<artifacts, experts_selected, retries, haltReason>>

\* PHASE_1 -> PHASE_2: briefingPath set AND experts non-empty
CompleteQuestioner ==
    /\ phase = "PHASE_1_QUESTIONER"
    /\ \E selectedExperts \in (SUBSET Experts \ {{}}) :
        /\ experts_selected' = selectedExperts
        /\ artifacts' = artifacts \cup {"briefingPath"}
        /\ phase' = "PHASE_2_DESIGN_DEBATE"
    /\ validationAttempts' = 0
    /\ UNCHANGED <<retries, haltReason, locked>>

\* PHASE_2 -> PHASE_3: designConsensusPath set
CompleteDesignDebate ==
    /\ phase = "PHASE_2_DESIGN_DEBATE"
    /\ artifacts' = artifacts \cup {"designConsensusPath"}
    /\ phase' = "PHASE_3_TLA_WRITER"
    /\ validationAttempts' = 0
    /\ UNCHANGED <<experts_selected, retries, haltReason, locked>>

\* PHASE_3 -> PHASE_4: tlaSpecPath set
CompleteTlaWriter ==
    /\ phase = "PHASE_3_TLA_WRITER"
    /\ artifacts' = artifacts \cup {"tlaSpecPath", "tlcResult"}
    /\ phase' = "PHASE_4_TLA_REVIEW"
    /\ validationAttempts' = 0
    /\ UNCHANGED <<experts_selected, retries, haltReason, locked>>

\* PHASE_4 -> PHASE_5: tlaReviewPath set
CompleteTlaReview ==
    /\ phase = "PHASE_4_TLA_REVIEW"
    /\ artifacts' = artifacts \cup {"tlaReviewPath"}
    /\ phase' = "PHASE_5_IMPLEMENTATION"
    /\ validationAttempts' = 0
    /\ UNCHANGED <<experts_selected, retries, haltReason, locked>>

\* PHASE_5 -> PHASE_6: implementationPlanPath set
CompleteImplementation ==
    /\ phase = "PHASE_5_IMPLEMENTATION"
    /\ artifacts' = artifacts \cup {"implementationPlanPath"}
    /\ phase' = "PHASE_6_PAIR_PROGRAMMING"
    /\ validationAttempts' = 0
    /\ UNCHANGED <<experts_selected, retries, haltReason, locked>>

\* PHASE_6 -> COMPLETE: unconditional, releases lock
\* Note: PHASE_6 produces no tracked pipeline artifacts. Code output from pair
\* programming is not modeled as a pipeline artifact path — it is the final
\* deliverable, not intermediate context. This is a deliberate abstraction.
CompletePairProgramming ==
    /\ phase = "PHASE_6_PAIR_PROGRAMMING"
    /\ phase' = "COMPLETE"
    /\ locked' = FALSE
    /\ validationAttempts' = 0
    /\ UNCHANGED <<artifacts, experts_selected, retries, haltReason>>

-----------------------------------------------------------------------------
\* Validation Failure
\*
\* Models the design's two-pass validator rejecting agent output. When
\* validation fails:
\*   - Phase does NOT advance (phase unchanged)
\*   - No artifacts are produced (artifacts unchanged)
\*   - validationAttempts is incremented
\*
\* This action is enabled for any phase that has a validator (ValidatedPhases).
\* When validationAttempts reaches MaxValidationAttempts, this action is
\* disabled and the only option is HaltValidationExhausted.
\*
\* The design's two-pass structure (structural Zod check then heuristic domain
\* check) is abstracted to a single boolean outcome here. The TLA+ spec does
\* not distinguish structural from heuristic failures — both result in the
\* same state machine behavior: phase stays, counter increments.
-----------------------------------------------------------------------------

ValidationFails ==
    /\ phase \in ValidatedPhases
    /\ validationAttempts < MaxValidationAttempts
    /\ validationAttempts' = validationAttempts + 1
    /\ UNCHANGED <<phase, artifacts, experts_selected, retries, haltReason, locked>>

\* When validation attempts are exhausted, the only option is HALTED.
HaltValidationExhausted ==
    /\ phase \in ValidatedPhases
    /\ validationAttempts >= MaxValidationAttempts
    /\ phase' = "HALTED"
    /\ haltReason' = "VALIDATION_EXHAUSTED"
    /\ locked' = FALSE
    /\ UNCHANGED <<artifacts, experts_selected, retries, validationAttempts>>

-----------------------------------------------------------------------------
\* Backward Transitions
-----------------------------------------------------------------------------

\* Artifacts cleared when going back to PHASE_1 (all context)
Phase1ClearSet == ArtifactNames

\* Artifacts cleared when going back to PHASE_3 from PHASE_4
Phase3ClearSet == {"tlaSpecPath", "tlcResult", "tlaReviewPath"}

\* PHASE_3 -> PHASE_1: clears all context, increments retries[PHASE_1]
BackToPhase1FromPhase3 ==
    /\ phase = "PHASE_3_TLA_WRITER"
    /\ retries["PHASE_1_QUESTIONER"] < MaxPipelineRetries
    /\ phase' = "PHASE_1_QUESTIONER"
    /\ artifacts' = artifacts \ Phase1ClearSet
    /\ experts_selected' = {}
    /\ retries' = [retries EXCEPT !["PHASE_1_QUESTIONER"] = @ + 1]
    /\ validationAttempts' = 0
    /\ UNCHANGED <<haltReason, locked>>

\* PHASE_4 -> PHASE_3: clears tlaSpecPath/tlcResult/tlaReviewPath, increments retries[PHASE_3]
BackToPhase3FromPhase4 ==
    /\ phase = "PHASE_4_TLA_REVIEW"
    /\ retries["PHASE_3_TLA_WRITER"] < MaxPipelineRetries
    /\ phase' = "PHASE_3_TLA_WRITER"
    /\ artifacts' = artifacts \ Phase3ClearSet
    /\ retries' = [retries EXCEPT !["PHASE_3_TLA_WRITER"] = @ + 1]
    /\ validationAttempts' = 0
    /\ UNCHANGED <<experts_selected, haltReason, locked>>

\* PHASE_4 -> PHASE_1: clears all context, increments retries[PHASE_1]
BackToPhase1FromPhase4 ==
    /\ phase = "PHASE_4_TLA_REVIEW"
    /\ retries["PHASE_1_QUESTIONER"] < MaxPipelineRetries
    /\ phase' = "PHASE_1_QUESTIONER"
    /\ artifacts' = artifacts \ Phase1ClearSet
    /\ experts_selected' = {}
    /\ retries' = [retries EXCEPT !["PHASE_1_QUESTIONER"] = @ + 1]
    /\ validationAttempts' = 0
    /\ UNCHANGED <<haltReason, locked>>

-----------------------------------------------------------------------------
\* Halt Transitions
\*
\* Split into guarded actions per halt reason (addresses HIGH objection #2).
\* RETRY_EXHAUSTED requires that at least one retry counter has reached max.
\* VALIDATION_EXHAUSTED is handled by HaltValidationExhausted above.
-----------------------------------------------------------------------------

\* USER_HALT: user cancels the pipeline from any non-terminal phase
HaltUserRequest ==
    /\ phase \in NonTerminalPhases
    /\ haltReason' = "USER_HALT"
    /\ phase' = "HALTED"
    /\ locked' = FALSE
    /\ UNCHANGED <<artifacts, experts_selected, retries, validationAttempts>>

\* AGENT_FAILURE: unrecoverable agent error from any non-terminal phase
HaltAgentFailure ==
    /\ phase \in NonTerminalPhases
    /\ haltReason' = "AGENT_FAILURE"
    /\ phase' = "HALTED"
    /\ locked' = FALSE
    /\ UNCHANGED <<artifacts, experts_selected, retries, validationAttempts>>

\* RETRY_EXHAUSTED: guarded — can only fire when at least one retry counter
\* has actually reached MaxPipelineRetries.
HaltRetryExhausted ==
    /\ phase \in NonTerminalPhases
    /\ \E p \in RetryablePhases : retries[p] >= MaxPipelineRetries
    /\ haltReason' = "RETRY_EXHAUSTED"
    /\ phase' = "HALTED"
    /\ locked' = FALSE
    /\ UNCHANGED <<artifacts, experts_selected, retries, validationAttempts>>

-----------------------------------------------------------------------------
\* Next State Relation
-----------------------------------------------------------------------------

\* Terminal states stutter (no further progress)
Terminated ==
    /\ phase \in TerminalPhases
    /\ UNCHANGED vars

Next ==
    \/ StartPipeline
    \/ CompleteQuestioner
    \/ CompleteDesignDebate
    \/ CompleteTlaWriter
    \/ CompleteTlaReview
    \/ CompleteImplementation
    \/ CompletePairProgramming
    \/ ValidationFails
    \/ HaltValidationExhausted
    \/ BackToPhase1FromPhase3
    \/ BackToPhase3FromPhase4
    \/ BackToPhase1FromPhase4
    \/ HaltUserRequest
    \/ HaltAgentFailure
    \/ HaltRetryExhausted
    \/ Terminated

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

-----------------------------------------------------------------------------
\* Safety Properties (Invariants)
-----------------------------------------------------------------------------

\* S1: RetryBounded — retries never exceed MaxPipelineRetries
RetryBounded ==
    \A p \in RetryablePhases : retries[p] <= MaxPipelineRetries

\* S2: ExpertsConsistent — once past PHASE_1 (and not halted/complete), experts is
\*     non-empty. Experts can only change on backward transitions that clear to PHASE_1.
ExpertsConsistent ==
    (phase \notin {"IDLE", "PHASE_1_QUESTIONER", "COMPLETE", "HALTED"})
        => experts_selected /= {}

\* S3: HaltReasonConsistent — haltReason != "NONE" iff phase = "HALTED"
HaltReasonConsistent ==
    (haltReason /= "NONE") <=> (phase = "HALTED")

\* S4: NoContextWithoutPhase — an artifact is present only if its producing
\*     phase has been reached (or we are past it).
\*
\*     NOTE: This invariant is the TLA+ equivalent of the design's discriminated
\*     union type system where Phase3Context extends Phase2Context extends
\*     Phase1Context. The TypeScript implementation uses structural typing to
\*     make invalid combinations unrepresentable. The TLA+ flattens context to
\*     a set of artifact name strings and uses this phase-ordering invariant to
\*     enforce the same constraint: an artifact cannot exist without its producing
\*     phase having been reached. The ordering constraint that the discriminated
\*     union enforces at the type level is captured here as a model-checked
\*     safety property.
NoContextWithoutPhase ==
    /\ ("briefingPath" \in artifacts         => PhaseOrd(phase) >= 2)
    /\ ("designConsensusPath" \in artifacts  => PhaseOrd(phase) >= 3)
    /\ ("tlaSpecPath" \in artifacts          => PhaseOrd(phase) >= 4)
    /\ ("tlcResult" \in artifacts            => PhaseOrd(phase) >= 4)
    /\ ("tlaReviewPath" \in artifacts        => PhaseOrd(phase) >= 5)
    /\ ("implementationPlanPath" \in artifacts => PhaseOrd(phase) >= 6)

\* S5: SingleInstance — lock is held iff pipeline is active (past IDLE, not terminal)
ActivePhases == NonTerminalPhases \ {"IDLE"}

SingleInstance ==
    locked <=> (phase \in ActivePhases)

\* S6: ValidationAttemptsBounded — validation attempts never exceed the max
ValidationAttemptsBounded ==
    validationAttempts <= MaxValidationAttempts

\* S7: ArtifactPreservation — after any transition, artifacts that should exist
\*     based on the current phase (i.e., all artifacts produced by phases strictly
\*     before the current phase) are present. This catches backward transitions
\*     that accidentally clear artifacts outside their defined clear set.
\*
\*     Uses ArtifactsCumulativeUpTo: for the current phase P, all artifacts
\*     produced by phases 1..P-1 must be in the artifacts set. This is only
\*     meaningful for non-IDLE, non-terminal phases (IDLE has no prior artifacts,
\*     terminal phases freeze state).
ArtifactPreservation ==
    (phase \notin {"IDLE", "HALTED"})
        => ArtifactsCumulativeUpTo(phase) \subseteq artifacts

-----------------------------------------------------------------------------
\* Liveness Properties
-----------------------------------------------------------------------------

\* L1: PipelineTerminates — from any non-IDLE state, eventually reach COMPLETE or HALTED
PipelineTerminates ==
    (phase /= "IDLE") ~> (phase \in TerminalPhases)

\* L2: RetryExhaustionHalts — if any retry counter reaches max, eventually HALTED
\*     (modeled: if we are in a retryable-target phase at max retries, we halt)
RetryExhaustionLeadsToTermination ==
    (\E p \in RetryablePhases : retries[p] >= MaxPipelineRetries)
        ~> (phase \in TerminalPhases)

\* L3: ValidationExhaustionHalts — if validation attempts reach max, eventually terminal
ValidationExhaustionLeadsToTermination ==
    (validationAttempts >= MaxValidationAttempts)
        ~> (phase \in TerminalPhases)

=============================================================================
