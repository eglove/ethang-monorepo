CREATE TABLE IF NOT EXISTS agent_sessions (
    session_id          TEXT PRIMARY KEY,
    agent_name          TEXT NOT NULL,
    role                TEXT NOT NULL,
    role_schema_version INTEGER NOT NULL DEFAULT 1,
    status              TEXT NOT NULL DEFAULT 'spawning',
    worktree            TEXT,
    pid                 INTEGER,
    spawn_epoch         INTEGER,
    death_epoch         INTEGER,
    renew_epoch         INTEGER,
    checkpointed_at_mono INTEGER,
    session_mono_epoch  INTEGER,
    ground_truth_delivered INTEGER NOT NULL DEFAULT 0,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
