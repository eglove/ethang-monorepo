# Canary Escalation Procedures

## Step 1: Automatic Rollback

When canary criteria are exceeded, the pipeline automatically:

1. Calls `send-canary-rollback-alert.ps1` to record the alert
2. Disables the offending stage feature flag
3. Verifies rollback by re-running gate scripts

## Step 2: Manual Triage (within 15 minutes)

If automatic rollback does not resolve within 5 minutes:

1. Review `docs/gate-ledger.jsonl` for recent alert entries
2. Identify which metric exceeded threshold
3. Check stage logs for the failing pipeline run
4. Manually disable all bus flags if multiple stages are affected

## Step 3: Root Cause Analysis

1. Reproduce the failure in a non-production worktree
2. Run `check-gate-executability.ps1` to verify gate scripts pass locally
3. Check TLA+ spec for invariant violations matching the observed failure
4. Review recent commits for changes to affected stage

## Step 4: Fix and Re-enable

1. Implement fix with TDD (red commit then green commit)
2. Run full test suite (target: 0 failures, coverage >= 91%)
3. Re-enable feature flag in canary
4. Monitor for 30 minutes before promoting to production
5. Append resolution record to `docs/gate-ledger.jsonl`
