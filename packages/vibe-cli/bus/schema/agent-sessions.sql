CREATE TABLE IF NOT EXISTS agent_sessions (
    session_id   TEXT PRIMARY KEY,
    agent_type   TEXT NOT NULL,
    worktree     TEXT,
    status       TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'terminated')),
    registered_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    last_seen_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions (status);
