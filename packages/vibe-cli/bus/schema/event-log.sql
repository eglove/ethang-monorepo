CREATE TABLE IF NOT EXISTS event_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    stream_id  TEXT NOT NULL,
    seq        INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    payload    TEXT NOT NULL DEFAULT '{}',
    emitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (stream_id, seq)
);

CREATE INDEX IF NOT EXISTS idx_event_log_stream ON event_log (stream_id, seq);
CREATE INDEX IF NOT EXISTS idx_event_log_type   ON event_log (event_type);
