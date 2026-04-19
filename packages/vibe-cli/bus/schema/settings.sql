CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Seed defaults
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('schema_version', '1'),
    ('retain_events', '10000'),
    ('schema_hash_algorithm', 'sha256-canonical-v1'),
    ('schema_hash', ''),
    ('previous_schema_hash', ''),
    ('VIBE_CANARY_SCHEMA_WINDOW_HOURS', '2');
