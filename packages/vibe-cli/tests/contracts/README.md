# Contract Tests — Snapshot-Based Mock Verification

## Why contract tests?

Test doubles (mocks) for `Invoke-Claude` and `Invoke-GitWithRetry` must stay synchronized with real CLI behaviour. When the real tool changes its output format, the mock must be updated — otherwise tests pass on stale assumptions. This is **mock drift**.

Contract tests prevent drift by recording the mock's output in a versioned snapshot file and failing whenever the mock produces different output.

## How it works

1. **Record phase** — Run the mock and write its output to `snapshots/*.snapshot.json`.
2. **Replay phase** — Run the mock again and compare against the snapshot. Any difference is a failure.
3. **Bidirectional check** — Both the snapshot and the mock are source of truth: if either changes without an explicit update, the test fails.

## Updating a snapshot

Only update when real CLI behaviour has genuinely changed and been reviewed:

```powershell example
Invoke-ContractTest `
    -ContractName 'claude-invoke' `
    -MockInvoker { ... } `
    -SnapshotPath './snapshots/claude-output.snapshot.json' `
    -UpdateSnapshot
```

Update requires a PR with justification: "The real `claude` CLI now returns X instead of Y."

## Files

| File                                    | Purpose                                                    |
| --------------------------------------- | ---------------------------------------------------------- |
| `contract-runner.ps1`                   | `Invoke-ContractTest`, `Compare-ContractSnapshot`, helpers |
| `claude-contract.Tests.ps1`             | 12 tests verifying the Claude mock                         |
| `git-contract.Tests.ps1`                | 9 tests verifying the git mock                             |
| `snapshots/claude-output.snapshot.json` | Versioned Claude mock output                               |
| `snapshots/git-output.snapshot.json`    | Versioned git mock output                                  |
