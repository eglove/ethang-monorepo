-- agent_sessions: tracks every agent spawned by the bus
--
-- Valid status transitions:
--   spawning       → alive          (bootstrap delivered)
--   alive          → checkpointing  (checkpoint requested)
--   checkpointing  → renewing       (checkpoint response received)
--   renewing       → alive          (respawned with checkpoint)
--   alive          → dead           (crash)
--   checkpointing  → dead           (crash during checkpoint)
--   alive          → ended          (clean shutdown)
--   dead           → ended          (cleanup)

CREATE TABLE IF NOT EXISTS agent_sessions (
    session_id              TEXT    PRIMARY KEY,
    agent_name              TEXT    NOT NULL,
    role                    TEXT    NOT NULL,
    role_schema_version     INTEGER NOT NULL DEFAULT 1,
    status                  TEXT    NOT NULL DEFAULT 'spawning',
    worktree                TEXT,
    pid                     INTEGER,
    checkpoint_json         TEXT,
    spawn_epoch             INTEGER,
    death_epoch             INTEGER,
    session_mono_epoch      INTEGER NOT NULL DEFAULT 0,
    checkpointed_at_mono    INTEGER,
    renew_epoch             INTEGER,
    ground_truth_delivered  INTEGER NOT NULL DEFAULT 0,
    created_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at              TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Alive Identity Index: only indexes agents that are actively running.
-- Covers status values: spawning, alive, checkpointing, renewing.
CREATE INDEX IF NOT EXISTS idx_agent_sessions_alive
    ON agent_sessions(agent_name)
    WHERE status IN ('spawning', 'alive', 'checkpointing', 'renewing');

-- Keep updated_at current on every update.
CREATE TRIGGER IF NOT EXISTS trg_agent_sessions_updated_at
    AFTER UPDATE ON agent_sessions
BEGIN
    UPDATE agent_sessions
    SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE session_id = NEW.session_id;
END;
