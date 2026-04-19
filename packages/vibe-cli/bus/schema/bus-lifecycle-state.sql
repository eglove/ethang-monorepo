CREATE TABLE IF NOT EXISTS bus_lifecycle_state (
    key TEXT PRIMARY KEY, value TEXT
);
INSERT OR IGNORE INTO bus_lifecycle_state (key, value) VALUES
    ('busStatus','running'),('pipeline_lock','0'),('halt_intent',NULL),
    ('halt_reason',NULL),('failure_category',NULL),('recovery_owner',NULL);
