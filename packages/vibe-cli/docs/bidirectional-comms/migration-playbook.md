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
