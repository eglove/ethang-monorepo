-- event_log: append-only event bus ledger
-- Every message sent between agents is recorded here.
-- Allowed status transitions:
--   routed -> committed
--   routed -> delivery_failed
-- All other transitions (including committed -> routed,
-- committed -> delivery_failed, delivery_failed -> *) are rejected.

CREATE TABLE IF NOT EXISTS event_log (
    evt_id      INTEGER PRIMARY KEY,
    "from"      TEXT NOT NULL,
    "to"        TEXT NOT NULL,
    in_reply_to INTEGER,
    group_id    TEXT,
    type        TEXT NOT NULL,
    payload     TEXT,           -- JSON, nullable
    status      TEXT NOT NULL DEFAULT 'routed'
);

-- BEFORE UPDATE: enforce append-only status machine
-- Only routed->committed and routed->delivery_failed are legal
CREATE TRIGGER IF NOT EXISTS trg_event_log_no_illegal_update
BEFORE UPDATE ON event_log
FOR EACH ROW
BEGIN
    SELECT CASE
        WHEN NOT (OLD.status = 'routed' AND NEW.status IN ('committed', 'delivery_failed'))
        THEN RAISE(ABORT, 'illegal status transition')
    END;
END;

-- BEFORE DELETE: event_log is strictly append-only, no deletions allowed
CREATE TRIGGER IF NOT EXISTS trg_event_log_no_delete
BEFORE DELETE ON event_log
FOR EACH ROW
BEGIN
    SELECT RAISE(ABORT, 'event_log is append-only');
END;

-- Query indices
CREATE INDEX IF NOT EXISTS idx_event_log_to_evtid
    ON event_log("to", evt_id);

CREATE INDEX IF NOT EXISTS idx_event_log_type_evtid
    ON event_log(type, evt_id);

CREATE INDEX IF NOT EXISTS idx_event_log_from_evtid
    ON event_log("from", evt_id);

CREATE INDEX IF NOT EXISTS idx_event_log_status
    ON event_log(status);

-- event_log_archive: same schema as event_log, holds compacted rows
CREATE TABLE IF NOT EXISTS event_log_archive (
    evt_id      INTEGER PRIMARY KEY,
    "from"      TEXT NOT NULL,
    "to"        TEXT NOT NULL,
    in_reply_to INTEGER,
    group_id    TEXT,
    type        TEXT NOT NULL,
    payload     TEXT,
    status      TEXT NOT NULL DEFAULT 'routed'
);

-- ---------------------------------------------------------------------------
-- Compaction algorithm (Invoke-EventLogCompaction) — implemented in PowerShell
-- migration runner; documented here for reference.
--
-- Parameters:
--   retain_events        INTEGER  (default from settings table, fallback 10000)
--   consensus_round_start INTEGER (the evt_id of the earliest uncommitted round)
--
-- Algorithm:
--   1. Identify the compaction boundary:
--        boundary = MIN(MAX(evt_id) - retain_events, consensus_round_start - 1)
--      If boundary <= 0, nothing to compact; return early.
--
--   2. Identify rows that MUST be retained (committed but not yet done):
--        committed_pending = SELECT evt_id FROM event_log
--                            WHERE status = 'committed'
--                              AND evt_id < boundary
--
--   3. Move eligible rows to event_log_archive:
--        INSERT INTO event_log_archive
--        SELECT * FROM event_log
--        WHERE evt_id < boundary
--          AND evt_id NOT IN (committed_pending)
--
--   4. Remove archived rows from event_log using a direct DELETE
--      (bypass the BEFORE DELETE trigger by dropping and re-creating
--       the trigger, or use a shadow copy approach — see migration runner).
--
-- Idempotency:
--   INSERT OR IGNORE ensures re-running compaction never duplicates archive rows.
--   The compaction boundary is always derived from current MAX(evt_id), so
--   repeated calls converge to the same stable set.
-- ---------------------------------------------------------------------------
