# TLA+ Specification: Questioner Stage Rewrite

## Source
Briefing: `docs/questioner-sessions/2026-04-04_questioner-stage-rewrite.md`
Debate: `docs/debate-moderator-sessions/2026-04-04_questioner-stage-rewrite.md`

## Specification
- **Module:** `QuestionerStageRewrite.tla`
- **Config:** `QuestionerStageRewrite.cfg`

## States
- **questioning** -- LLM is formulating a question or processing retry
- **awaitingInput** -- waiting for user response (normal answer, /summary, or SIGINT)
- **summaryPresented** -- summary shown, user decides to continue or sign off
- **signingOff** -- CLI has requested signoff from LLM, awaiting cooperation
- **completed** -- session finished successfully, briefing saved
- **failed** -- session terminated due to error, abandonment, or safety valve

## Properties Verified

### Safety (Invariants)
- **TypeOK** -- all variables stay within their declared domains
- **StoreCompletedOnlyAfterSignoff** -- store reaches "completed" only when session is completed, artifact is complete, and briefing is saved
- **RetryBounded** -- retry count never exceeds MaxRetries (3)
- **SignoffAttemptsBounded** -- signoff attempts never exceed MaxSignoffAttempts (3)
- **TurnsBounded** -- turn count never exceeds MaxTurns (safety valve)
- **LintDoublePassRequired** -- stages 2-7 only dispatch after two consecutive clean lint runs
- **CompletedRequiresBriefing** -- completed status requires briefing saved
- **FailedHasErrorKind** -- failed status always carries an error kind (retry_exhausted, user_abandon, signoff_exhausted, turn_cap_exceeded)
- **WaitForOnlyOnTerminal** -- waitFor resolves only in terminal states (completed or failed)
- **StagesOnlyAfterLintPass** -- stages 2-7 only dispatch after completed session with lint double-pass

### Liveness
- **SessionTerminates** -- every session eventually reaches completed or failed
- **WaitForResolves** -- the store waitFor completion gate always resolves
- **StagesEventuallyDispatch** -- if session completes and lint passes, stages 2-7 eventually dispatch

## TLC Results
- **States generated:** 5,338
- **Distinct states:** 4,394
- **Result:** PASS
- **Workers:** 24
- **Depth:** 25
- **Date:** 2026-04-04

## Design Gaps Modeled
1. **Gap #2 (Liveness bound):** MaxTurns safety valve with TurnCapExceeded action
2. **Gap #3 (SIGNING_OFF guard):** LLMRefusesSignoff + CLIForcesSignoff after MaxSignoffAttempts
3. **Gap #4 (Discriminated union):** 6-state sessionState variable
4. **Gap #5 (Exact-match /summary):** UserRequestsSummary only from awaitingInput
5. **Gap #6 (Retry-exhaustion store status):** RetryExhausted sets storeErrorKind to retry_exhausted
6. **Gap #8 (Feature flag):** featureFlagOn modeled non-deterministically, DispatchStages gated on lint pass

## Prior Versions
None
