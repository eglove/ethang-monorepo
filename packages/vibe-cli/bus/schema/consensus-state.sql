CREATE TABLE IF NOT EXISTS consensus_state (
    key   TEXT PRIMARY KEY,
    value TEXT
);
INSERT OR IGNORE INTO consensus_state (key, value) VALUES
    ('consensusState', 'open'),
    ('consensusRoundStart', '1'),
    ('unresolvedObjections', '[]'),
    ('overriddenObjections', '[]');
