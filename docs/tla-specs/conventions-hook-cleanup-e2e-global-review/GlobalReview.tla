----------------------- MODULE GlobalReview -----------------------
(**************************************************************************)
(* TLA+ specification for the Global Review Double-Pass Protocol.         *)
(*                                                                        *)
(* Models the Stage 6 global review loop where the project-manager runs   *)
(* a full sequence of steps (test -> lint -> tsc) twice. Two consecutive   *)
(* clean passes with zero fixes = SUCCESS. Each step gets at most one     *)
(* inline fix attempt per pass. If a step fails after its inline fix,     *)
(* the entire sequence restarts and fixCount increments. If fixCount      *)
(* reaches MaxGlobalFixes, the pipeline halts as EXHAUSTED.               *)
(*                                                                        *)
(* Source: docs/questioner-sessions/                                       *)
(*   2026-04-03_conventions-hook-cleanup-e2e-global-review.md             *)
(**************************************************************************)

EXTENDS Integers, FiniteSets

CONSTANTS
    NumSteps,        \* Number of steps in the sequence (e.g. 3 for test, lint, tsc)
    MaxGlobalFixes   \* Maximum full-sequence restarts before EXHAUSTED

VARIABLES
    phase,           \* "idle" | "running" | "fixing" | "clean1" | "success" | "restarting" | "exhausted"
    currentStep,     \* Index into step sequence (1..NumSteps) or 0
    passNumber,      \* 1 or 2 — which clean pass we are on
    retryFlag,       \* 0 or 1 — whether current step is a retry after inline fix
    fixCount         \* Number of full-sequence restarts so far (0..MaxGlobalFixes)

vars == <<phase, currentStep, passNumber, retryFlag, fixCount>>

-----------------------------------------------------------------------------

(* Type invariant *)
TypeOK ==
    /\ phase \in {"idle", "running", "fixing", "clean1", "success", "restarting", "exhausted"}
    /\ currentStep \in 0..NumSteps
    /\ passNumber \in {1, 2}
    /\ retryFlag \in {0, 1}
    /\ fixCount \in 0..MaxGlobalFixes

-----------------------------------------------------------------------------

(* Initial state *)
Init ==
    /\ phase = "idle"
    /\ currentStep = 0
    /\ passNumber = 1
    /\ retryFlag = 0
    /\ fixCount = 0

-----------------------------------------------------------------------------

(* Action: Pipeline enters global review, starts pass 1 at step 1 *)
StartReview ==
    /\ phase = "idle"
    /\ phase' = "running"
    /\ currentStep' = 1
    /\ passNumber' = 1
    /\ retryFlag' = 0
    /\ UNCHANGED fixCount

(* Action: Current step passes cleanly, advance to next step *)
StepClean ==
    /\ phase = "running"
    /\ currentStep >= 1
    /\ currentStep < NumSteps
    /\ phase' = "running"
    /\ currentStep' = currentStep + 1
    /\ retryFlag' = 0
    /\ UNCHANGED <<passNumber, fixCount>>

(* Action: Last step passes cleanly on pass 1 -> clean pass 1 complete *)
LastStepCleanPass1 ==
    /\ phase = "running"
    /\ currentStep = NumSteps
    /\ passNumber = 1
    /\ phase' = "clean1"
    /\ currentStep' = 0
    /\ retryFlag' = 0
    /\ UNCHANGED <<passNumber, fixCount>>

(* Action: Last step passes cleanly on pass 2 -> SUCCESS *)
LastStepCleanPass2 ==
    /\ phase = "running"
    /\ currentStep = NumSteps
    /\ passNumber = 2
    /\ phase' = "success"
    /\ currentStep' = 0
    /\ retryFlag' = 0
    /\ UNCHANGED <<passNumber, fixCount>>

(* Action: Start pass 2 after clean pass 1 *)
StartPass2 ==
    /\ phase = "clean1"
    /\ phase' = "running"
    /\ currentStep' = 1
    /\ passNumber' = 2
    /\ retryFlag' = 0
    /\ UNCHANGED fixCount

(* Action: Step fails on first attempt (retryFlag=0), PM does inline fix *)
StepFailFirstAttempt ==
    /\ phase = "running"
    /\ currentStep >= 1
    /\ retryFlag = 0
    /\ phase' = "fixing"
    /\ UNCHANGED <<currentStep, passNumber, retryFlag, fixCount>>

(* Action: PM applies inline fix, re-runs the step (retry=1) *)
ApplyInlineFix ==
    /\ phase = "fixing"
    /\ phase' = "running"
    /\ retryFlag' = 1
    /\ UNCHANGED <<currentStep, passNumber, fixCount>>

(* Action: Step fails again after inline fix (retryFlag=1), full restart *)
StepFailAfterRetry ==
    /\ phase = "running"
    /\ currentStep >= 1
    /\ retryFlag = 1
    /\ phase' = "restarting"
    /\ UNCHANGED <<currentStep, passNumber, retryFlag, fixCount>>

(* Action: Restart sequence when fixCount < MaxGlobalFixes *)
RestartSequence ==
    /\ phase = "restarting"
    /\ fixCount + 1 < MaxGlobalFixes
    /\ phase' = "running"
    /\ currentStep' = 1
    /\ passNumber' = 1
    /\ retryFlag' = 0
    /\ fixCount' = fixCount + 1

(* Action: fixCount reaches MaxGlobalFixes -> EXHAUSTED *)
BecomeExhausted ==
    /\ phase = "restarting"
    /\ fixCount + 1 >= MaxGlobalFixes
    /\ phase' = "exhausted"
    /\ currentStep' = 0
    /\ retryFlag' = 0
    /\ fixCount' = fixCount + 1
    /\ UNCHANGED passNumber

(* Terminal states stutter to avoid false deadlock *)
Stutter ==
    /\ phase \in {"success", "exhausted"}
    /\ UNCHANGED vars

-----------------------------------------------------------------------------

(* Next-state relation *)
Next ==
    \/ StartReview
    \/ StepClean
    \/ LastStepCleanPass1
    \/ LastStepCleanPass2
    \/ StartPass2
    \/ StepFailFirstAttempt
    \/ ApplyInlineFix
    \/ StepFailAfterRetry
    \/ RestartSequence
    \/ BecomeExhausted
    \/ Stutter

(* Fairness: every enabled action eventually executes *)
Fairness ==
    /\ WF_vars(StartReview)
    /\ WF_vars(StepClean)
    /\ WF_vars(LastStepCleanPass1)
    /\ WF_vars(LastStepCleanPass2)
    /\ WF_vars(StartPass2)
    /\ WF_vars(ApplyInlineFix)
    /\ WF_vars(RestartSequence)
    /\ WF_vars(BecomeExhausted)

Spec == Init /\ [][Next]_vars /\ Fairness

-----------------------------------------------------------------------------

(* SAFETY PROPERTIES *)

(* S1: fixCount never exceeds MaxGlobalFixes *)
FixCountBounded == fixCount <= MaxGlobalFixes

(* S2: Pass 2 is only reachable after pass 1 completes cleanly.
       If passNumber = 2, we must have gone through clean1. *)
Pass2RequiresCleanPass1 ==
    (passNumber = 2) => (phase \in {"running", "fixing", "restarting", "success", "exhausted"})

(* S3: A step can only be retried once (retryFlag is 0 or 1, enforced by TypeOK,
       and the fixing->running transition is the only way retryFlag becomes 1) *)
RetryCapRespected == retryFlag \in {0, 1}

(* S4: SUCCESS requires exactly pass 2 completion *)
SuccessRequiresPass2 ==
    (phase = "success") => (passNumber = 2)

(* S5: EXHAUSTED only when fixCount = MaxGlobalFixes *)
ExhaustedRequiresMaxFixes ==
    (phase = "exhausted") => (fixCount = MaxGlobalFixes)

(* S6: Inline fix only happens once per step per pass.
       When in fixing state, retryFlag must be 0 (first attempt failed). *)
InlineFixOnlyOnFirstFailure ==
    (phase = "fixing") => (retryFlag = 0)

(* S7: No progress without entering running phase first *)
NoFixWithoutRunning ==
    (phase = "fixing") => (currentStep >= 1)

-----------------------------------------------------------------------------

(* LIVENESS PROPERTIES *)

(* L1: The system eventually terminates — reaches success or exhausted *)
EventualTermination == <>(phase = "success" \/ phase = "exhausted")

=============================================================================
