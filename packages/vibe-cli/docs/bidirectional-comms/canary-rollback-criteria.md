# Canary Rollback Criteria

Trigger an automatic rollback when any of the following conditions are met:

## Error Rate Thresholds

| Metric | Threshold | Window |
|--------|-----------|--------|
| Bus publish error rate | > 1% | 5 minutes |
| Stage completion failure rate | > 0.5% | 10 minutes |
| consensus_fail event rate | > 2% | 5 minutes |

## Latency Thresholds

| Metric | Threshold |
|--------|-----------|
| Bus P99 publish latency | > 20ms |
| Stage P99 latency | > 120% of baseline |
| Git stash P99 | > 3000ms |

## Structural Failures

- Any gate script returns non-zero during canary health check
- Schema hash mismatch detected
- Feature flag inconsistency detected across stages
- SQLite WAL checkpoint failure rate > 0%

## Rollback Trigger

When criteria are met, `send-canary-rollback-alert.ps1` is invoked with the
failing metric, value, and threshold. The alert is recorded in `docs/gate-ledger.jsonl`
for post-incident analysis.
