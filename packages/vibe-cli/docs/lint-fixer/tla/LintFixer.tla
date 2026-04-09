--------------------------- MODULE LintFixer ---------------------------
(**************************************************************************)
(* TLA+ Specification: Lint-Fixer Agent                                   *)
(*                                                                        *)
(* Models the full lifecycle of the lint-fixer agent:                      *)
(*   INIT -> AUTOFIX -> VERIFY -> MANUAL (loop) -> LEARN -> COMMIT        *)
(*                                                                        *)
(* Source: packages/vibe-cli/docs/lint-fixer/bdd.feature (Revision 4)     *)
(* Date:   2026-04-07                                                     *)
(**************************************************************************)

EXTENDS Integers, FiniteSets, TLC

CONSTANTS
    MaxViolations,      \* Upper bound on concurrent violations (small for checking)
    MaxAttempts,        \* Per-violation attempt budget before suppression (5 in prod)
    MaxVMIterations     \* VERIFY-MANUAL loop cap (10 in prod)

VARIABLES
    phase,              \* Current lifecycle phase
    violations,         \* Count of remaining violations
    resolved,           \* Total violations resolved this dispatch
    suppressed,         \* Total violations suppressed this dispatch
    vmIteration,        \* VERIFY-MANUAL iteration counter (0-based, incremented on VERIFY)
    attemptsLeft,       \* Minimum attempts remaining across current violation set
    result,             \* Terminal result code reported to orchestrator
    filesModified       \* Whether any source files were modified

vars == <<phase, violations, resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

(**************************************************************************)
(* Type Definitions                                                       *)
(**************************************************************************)

Phases == {
    "init",                 \* Loading learned-fixes, checking working tree
    "autofix",              \* Running pnpm lint --fix
    "verify_post_autofix",  \* First pnpm lint after autofix (not counted as VM iteration)
    "manual",               \* LLM-driven per-violation fixes
    "verify",               \* pnpm lint verification (counted VM iterations)
    "learn",                \* Writing to lint-fixer-learned.md
    "commit",               \* Creating git commit
    "done"                  \* Terminal state
}

Results == {
    "none",             \* Not yet determined
    "clean",            \* Zero violations found, no changes made
    "fixed",            \* Violations resolved/suppressed and committed
    "failed_process",   \* ESLint config error, crash, segfault, or timeout
    "failed_io"         \* Disk, permission, or git I/O error
}

TypeOK ==
    /\ phase \in Phases
    /\ violations \in 0..MaxViolations
    /\ resolved \in 0..(MaxViolations * (MaxVMIterations + 2))
    /\ suppressed \in 0..(MaxViolations * (MaxVMIterations + 2))
    /\ vmIteration \in 0..MaxVMIterations
    /\ attemptsLeft \in 0..MaxAttempts
    /\ result \in Results
    /\ filesModified \in BOOLEAN

(**************************************************************************)
(* Initial State                                                          *)
(**************************************************************************)

Init ==
    /\ phase = "init"
    /\ violations = 0
    /\ resolved = 0
    /\ suppressed = 0
    /\ vmIteration = 0
    /\ attemptsLeft = MaxAttempts
    /\ result = "none"
    /\ filesModified = FALSE

(**************************************************************************)
(* INIT Phase Actions                                                     *)
(* Loads learned-fixes (graceful degradation on malformed/missing file).   *)
(* Records snapshot of pre-existing unstaged changes.                     *)
(* Always transitions to AUTOFIX.                                         *)
(**************************************************************************)

Initialize ==
    /\ phase = "init"
    /\ phase' = "autofix"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

(**************************************************************************)
(* AUTOFIX Phase Actions                                                  *)
(* Runs pnpm lint --fix. Three possible outcomes:                         *)
(*   1. Zero violations exist -> done(clean)                              *)
(*   2. Process error -> done(failed_process)                             *)
(*   3. Autofix runs, resolves some/all -> verify_post_autofix            *)
(**************************************************************************)

AutofixClean ==
    \* pnpm lint reports zero violations — nothing to do
    /\ phase = "autofix"
    /\ phase' = "done"
    /\ result' = "clean"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, filesModified>>

AutofixProcessError ==
    \* Config parse error, ESLint crash, or timeout
    /\ phase = "autofix"
    /\ phase' = "done"
    /\ result' = "failed_process"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, filesModified>>

AutofixRun ==
    \* Autofix resolves some violations; remainder goes to verification
    /\ phase = "autofix"
    /\ \E total \in 1..MaxViolations :
        \E remaining \in 0..total :
            /\ violations' = remaining
            /\ resolved' = total - remaining
            /\ filesModified' = (total - remaining > 0)
    /\ phase' = "verify_post_autofix"
    /\ attemptsLeft' = MaxAttempts
    /\ UNCHANGED <<suppressed, vmIteration, result>>

(**************************************************************************)
(* VERIFY Post-Autofix Actions                                            *)
(* Runs pnpm lint after autofix. NOT counted as a VM iteration.           *)
(*   - Zero violations -> LEARN (skip MANUAL)                             *)
(*   - Violations remain -> MANUAL                                        *)
(*   - New violations introduced by autofix -> MANUAL                     *)
(**************************************************************************)

VerifyPostAutofixClean ==
    /\ phase = "verify_post_autofix"
    /\ violations = 0
    /\ phase' = "learn"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

VerifyPostAutofixRemaining ==
    \* Original violations remain after autofix
    /\ phase = "verify_post_autofix"
    /\ violations > 0
    /\ phase' = "manual"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

VerifyPostAutofixNewViolations ==
    \* Autofix resolved originals but introduced NEW violations
    /\ phase = "verify_post_autofix"
    /\ violations = 0
    /\ \E newV \in 1..MaxViolations :
        violations' = newV
    /\ phase' = "manual"
    /\ UNCHANGED <<resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

(**************************************************************************)
(* MANUAL Phase Actions                                                   *)
(* LLM applies fixes per-violation. Consults learned-fixes first.         *)
(* After processing, always transitions to VERIFY.                        *)
(* vmIteration incremented when entering VERIFY from MANUAL.              *)
(**************************************************************************)

ManualFixAll ==
    \* All remaining violations resolved in this pass
    /\ phase = "manual"
    /\ violations > 0
    /\ resolved' = resolved + violations
    /\ violations' = 0
    /\ phase' = "verify"
    /\ vmIteration' = vmIteration + 1
    /\ filesModified' = TRUE
    /\ UNCHANGED <<suppressed, attemptsLeft, result>>

ManualFixSome ==
    \* Some violations resolved, others remain with reduced attempt budget
    /\ phase = "manual"
    /\ violations > 1
    /\ \E fixedCount \in 1..(violations - 1) :
        /\ resolved' = resolved + fixedCount
        /\ violations' = violations - fixedCount
    /\ \E newMin \in 0..attemptsLeft :
        attemptsLeft' = newMin
    /\ phase' = "verify"
    /\ vmIteration' = vmIteration + 1
    /\ filesModified' = TRUE
    /\ UNCHANGED <<suppressed, result>>

ManualFixNone ==
    \* No violations resolved this pass (stuck or still attempting)
    /\ phase = "manual"
    /\ violations > 0
    /\ \E newMin \in 0..(attemptsLeft - 1) :
        attemptsLeft' = newMin
    /\ phase' = "verify"
    /\ vmIteration' = vmIteration + 1
    /\ UNCHANGED <<violations, resolved, suppressed, result, filesModified>>

ManualSuppressExhausted ==
    \* Some violations exhausted their per-violation attempt budget
    /\ phase = "manual"
    /\ violations > 0
    /\ attemptsLeft = 0
    /\ \E suppressCount \in 1..violations :
        /\ suppressed' = suppressed + suppressCount
        /\ violations' = violations - suppressCount
        /\ attemptsLeft' = IF violations - suppressCount > 0
                           THEN MaxAttempts
                           ELSE 0
    /\ phase' = "verify"
    /\ vmIteration' = vmIteration + 1
    /\ filesModified' = TRUE
    /\ UNCHANGED <<resolved, result>>

ManualIntroducesNew ==
    \* Fixing some violations introduces new ones (cascade, cross-file)
    /\ phase = "manual"
    /\ violations > 0
    /\ \E fixedCount \in 1..violations :
        \E newCount \in 1..MaxViolations :
            LET remaining == (violations - fixedCount) + newCount
            IN  /\ remaining <= MaxViolations
                /\ remaining > 0
                /\ resolved' = resolved + fixedCount
                /\ violations' = remaining
    /\ phase' = "verify"
    /\ vmIteration' = vmIteration + 1
    /\ filesModified' = TRUE
    /\ UNCHANGED <<suppressed, attemptsLeft, result>>

ManualProcessError ==
    \* pnpm lint crashes or times out during manual phase
    /\ phase = "manual"
    /\ phase' = "done"
    /\ result' = "failed_process"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, filesModified>>

(**************************************************************************)
(* VERIFY Phase Actions (Counted Iterations)                              *)
(* Iteration N = Nth MANUAL pass + its subsequent VERIFY check.           *)
(* Cap = MaxVMIterations. On cap, suppress all remaining.                 *)
(**************************************************************************)

VerifyClean ==
    \* Zero violations — proceed to LEARN
    /\ phase = "verify"
    /\ violations = 0
    /\ phase' = "learn"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

VerifyLoopBack ==
    \* Violations remain, under cap — loop back to MANUAL
    /\ phase = "verify"
    /\ violations > 0
    /\ vmIteration < MaxVMIterations
    /\ phase' = "manual"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

VerifyCapReached ==
    \* Cap reached — suppress all remaining violations
    /\ phase = "verify"
    /\ violations > 0
    /\ vmIteration >= MaxVMIterations
    /\ suppressed' = suppressed + violations
    /\ violations' = 0
    /\ phase' = "learn"
    /\ filesModified' = TRUE
    /\ UNCHANGED <<resolved, vmIteration, attemptsLeft, result>>

(**************************************************************************)
(* LEARN Phase Actions                                                    *)
(* Writes multi-try solutions and unresolved patterns to learned-fixes.   *)
(* Cap-triggered suppressions recorded as UNRESOLVED entries.             *)
(**************************************************************************)

LearnSuccess ==
    /\ phase = "learn"
    /\ phase' = "commit"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, result, filesModified>>

LearnIOFailure ==
    \* Disk full, permission error writing learned-fixes
    \* Fixes preserved in working tree, but COMMIT skipped
    /\ phase = "learn"
    /\ phase' = "done"
    /\ result' = "failed_io"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, filesModified>>

(**************************************************************************)
(* COMMIT Phase Actions                                                   *)
(* Creates a single git commit with source fixes + learned-fixes.         *)
(* Commit message format depends on resolved vs suppressed counts.        *)
(**************************************************************************)

CommitSuccess ==
    /\ phase = "commit"
    /\ filesModified = TRUE
    /\ phase' = "done"
    /\ result' = "fixed"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, filesModified>>

CommitIOFailure ==
    \* Hook rejection, disk full, or I/O error
    /\ phase = "commit"
    /\ phase' = "done"
    /\ result' = "failed_io"
    /\ UNCHANGED <<violations, resolved, suppressed, vmIteration, attemptsLeft, filesModified>>

(**************************************************************************)
(* Terminal State                                                         *)
(**************************************************************************)

Done ==
    /\ phase = "done"
    /\ UNCHANGED vars

(**************************************************************************)
(* Next-State Relation                                                    *)
(**************************************************************************)

Next ==
    \* INIT
    \/ Initialize
    \* AUTOFIX
    \/ AutofixClean
    \/ AutofixProcessError
    \/ AutofixRun
    \* VERIFY post-autofix
    \/ VerifyPostAutofixClean
    \/ VerifyPostAutofixRemaining
    \/ VerifyPostAutofixNewViolations
    \* MANUAL
    \/ ManualFixAll
    \/ ManualFixSome
    \/ ManualFixNone
    \/ ManualSuppressExhausted
    \/ ManualIntroducesNew
    \/ ManualProcessError
    \* VERIFY (counted)
    \/ VerifyClean
    \/ VerifyLoopBack
    \/ VerifyCapReached
    \* LEARN
    \/ LearnSuccess
    \/ LearnIOFailure
    \* COMMIT
    \/ CommitSuccess
    \/ CommitIOFailure
    \* Terminal
    \/ Done

Spec == Init /\ [][Next]_vars /\ WF_vars(Next)

(**************************************************************************)
(* SAFETY PROPERTIES (Invariants)                                         *)
(**************************************************************************)

\* S1: VERIFY-MANUAL iteration count never exceeds the cap
VMIterationBounded ==
    vmIteration <= MaxVMIterations

\* S2: Terminal state always has a valid result code
ValidTerminalResult ==
    phase = "done" => result /= "none"

\* S3: "fixed" result requires that files were actually modified
NoEmptyCommit ==
    (phase = "done" /\ result = "fixed") => filesModified = TRUE

\* S4: "clean" result means zero resolved and zero suppressed
CleanMeansNoWork ==
    (phase = "done" /\ result = "clean") =>
        /\ resolved = 0
        /\ suppressed = 0

\* S5: No violations left dangling when reporting "fixed"
AllViolationsHandled ==
    (phase = "done" /\ result = "fixed") => violations = 0

\* S6: No violations left dangling when reporting "clean"
CleanMeansNoViolations ==
    (phase = "done" /\ result = "clean") => violations = 0

\* S7: COMMIT only reachable when files were modified
\* (Structural: CommitSuccess guard requires filesModified = TRUE)
CommitRequiresModification ==
    phase = "commit" => filesModified = TRUE

\* S8: Result is "none" until terminal phase
ResultOnlyAtTerminal ==
    phase /= "done" => result = "none"

\* S9: vmIteration is zero until MANUAL/VERIFY loop begins
VMIterationNotPremature ==
    phase \in {"init", "autofix", "verify_post_autofix"} => vmIteration = 0

(**************************************************************************)
(* LIVENESS PROPERTIES (Temporal Formulas)                                *)
(**************************************************************************)

\* L1: The agent eventually reaches a terminal state
EventuallyTerminates ==
    <>(phase = "done")

\* L2: The agent eventually produces a result
EventuallyProducesResult ==
    <>(result /= "none")

\* L3: If violations exist after autofix, they are eventually handled
\*     (resolved, suppressed, or agent fails with an error)
ViolationsEventuallyHandled ==
    [](violations > 0 => <>(violations = 0 \/ phase = "done"))

=============================================================================
