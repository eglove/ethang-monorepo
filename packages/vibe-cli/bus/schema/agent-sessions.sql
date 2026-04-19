CREATE TABLE IF NOT EXISTS agent_sessions (
    session_id TEXT PRIMARY KEY,
    agent_name TEXT NOT NULL,
    role TEXT NOT NULL,
    role_schema_version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'spawning',
    worktree TEXT,
    pid INTEGER,
    checkpoint_json TEXT,
    spawn_epoch INTEGER,
    death_epoch INTEGER,
    session_mono_epoch INTEGER NOT NULL DEFAULT 0,
    checkpointed_at TEXT,
    checkpointed_at_mono INTEGER,
    ground_truth_delivered INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_alive ON agent_sessions(agent_name) WHERE status IN ('spawning','alive','checkpointing','renewing');
