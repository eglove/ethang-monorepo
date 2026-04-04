# TLA+ Specification: Global Review Double-Pass Protocol

## Source
Briefing: `docs/questioner-sessions/2026-04-03_conventions-hook-cleanup-e2e-global-review.md`

## Specification
- **Module:** `GlobalReview.tla`
- **Config:** `GlobalReview.cfg`

## States
- **idle** -- pipeline has not yet entered global review
- **running(step, pass)** -- executing step `currentStep` of pass `passNumber`
- **fixing(step, pass)** -- PM is applying an inline fix for a failed step
- **clean1** -- all steps passed cleanly on pass 1, ready to start pass 2
- **success** -- two consecutive clean passes completed (terminal)
- **restarting** -- inline fix failed on retry, sequence will restart with incremented fixCount
- **exhausted** -- fixCount reached MaxGlobalFixes (terminal)

## Properties Verified
### Safety (Invariants)
- **TypeOK** -- all variables remain within their declared domains
- **FixCountBounded** -- fixCount never exceeds MaxGlobalFixes
- **Pass2RequiresCleanPass1** -- pass 2 is only reachable after pass 1 completes cleanly
- **RetryCapRespected** -- retryFlag is always 0 or 1 (at most one inline fix per step)
- **SuccessRequiresPass2** -- SUCCESS state requires pass 2 completion
- **ExhaustedRequiresMaxFixes** -- EXHAUSTED state only when fixCount equals MaxGlobalFixes
- **InlineFixOnlyOnFirstFailure** -- fixing phase only entered when retryFlag is 0
- **NoFixWithoutRunning** -- fixing phase requires currentStep >= 1

### Liveness
- **EventualTermination** -- the system eventually reaches success or exhausted

## TLC Results
- **States explored:** 118
- **Distinct states:** 81
- **Result:** PASS (no errors found)
- **Workers:** 4
- **Date:** 2026-04-03

## Prior Versions
None
