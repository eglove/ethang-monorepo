CREATE TABLE IF NOT EXISTS rollback_state (
    key   TEXT PRIMARY KEY,
    value TEXT
);

INSERT OR IGNORE INTO rollback_state (key, value) VALUES
    ('rollbackRequested', '0'),
    ('rollbackTargetWorktree', NULL),
    ('snapshotExists', '0'),
    ('rollback_phase', NULL),
    ('rollback_execution_id', NULL);
