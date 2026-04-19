# Bus Schema Migration Playbook

## Forward Migration

Run `vibe schema-migrate` to apply (or re-apply) the full bus schema to the SQLite database.

```powershell
./vibe.ps1 schema-migrate
# or with auto-confirm:
./vibe.ps1 schema-migrate --force
```

The command:
1. Creates the database if it does not exist.
2. Applies all schema SQL files in dependency order:
   `event-log.sql`, `agent-sessions.sql`, `settings.sql`,
   `bus-lifecycle-state.sql`, `consensus-state.sql`, `rollback-state.sql`
3. Seeds default values for all aggregate tables.
4. Computes the `sha256-canonical-v1` schema hash and stores it in `settings.schema_hash`.
5. Emits `[INFO] Migration complete. Schema version: 1`.

Migration is idempotent — running it multiple times produces the same schema and the same hash.

## Rollback

Run `vibe schema-rollback` to step the schema back by **exactly one version**:

```powershell
./vibe.ps1 schema-rollback
# or with auto-confirm:
./vibe.ps1 schema-rollback --force
```

- Multi-stage rollback (jumping more than one version) is **not supported**.
  If you need to go from v3 to v1, run `vibe schema-rollback` twice.
- A pre-rollback backup is always created before any `DROP TABLE`.
- The command exits non-zero if the backup integrity check fails.

## Backup

Before any rollback, `vibe schema-rollback` automatically creates a backup:

```
.vibe/backups/<yyyyMMddTHHmmssZ>/
  vibe-bus.db            # full copy of the database
  backup-manifest.json   # { BackupPath, Sha256, CreatedAt }
```

The SHA-256 of the backup file is computed immediately after copying,
then re-verified from disk before any `DROP TABLE` is executed.
If the two hashes differ the rollback is aborted with `[ALARM]`.

## Canary Ladder

Schema changes follow a progressive canary rollout:

| Phase | Traffic |
|-------|---------|
| 1     | 1 %     |
| 2     | 5 %     |
| 3     | 25 %    |
| 4     | 100 %   |

Each canary window defaults to `VIBE_CANARY_SCHEMA_WINDOW_HOURS` (default: 2 hours).
Monitor error rates before promoting to the next phase.

## Per-Tier Rollback

| Tiers   | Rollback Strategy |
|---------|-------------------|
| 1 – 3   | `git revert` the offending commit(s) only |
| 4 – 8   | `git revert` + `vibe schema-rollback` (one version at a time) |
| 9 – 11  | Reverse stage commits in dependency order + `vibe schema-rollback` |

Always verify with `vibe schema-migrate` (idempotent check) after rollback
to confirm the settled schema hash matches the expected baseline.

---

# Bidirectional Comms Feature-Flag Migration

## Feature Flag Enable Order

Enable flags in stage order to avoid dependency violations:

1. `VIBE_STAGE_2_BIDIR` — enables Stage 2 (Parallel Writers) bus integration
2. `VIBE_STAGE_3_BIDIR` — enables Stage 3 (Unified Debate) bus integration
3. `VIBE_STAGE_4_BIDIR` — enables Stage 4 (Post-Debate) bus integration
4. `VIBE_STAGE_5_BIDIR` — enables Stage 5 (Impl Writer) bus integration
5. `VIBE_STAGE_6_BIDIR` — enables Stage 6 (Implementation Debate) bus integration
6. `VIBE_STAGE_7_BIDIR` — enables Stage 7 (Coding Stage) bus integration

Each flag requires the previous stage flag to be active before enabling.

## Flag Rollback Procedure

1. Identify the failing stage from `docs/gate-ledger.jsonl`
2. Disable the flag for that stage and all subsequent stages
3. Verify pipeline resumes with the pre-bus code path
4. File an incident report documenting the failure metrics
5. Re-enable after root cause is resolved

## Canary Stability Criteria

A canary deployment is considered stable when:

- Error rate remains below 1% for 30 minutes
- P99 latency stays within 20% of baselines
- No `consensus_fail` events triggered by bus errors
- All gate scripts return 0 in the canary environment
