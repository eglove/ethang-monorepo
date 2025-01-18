DROP TABLE IF EXISTS Track;
CREATE TABLE IF NOT EXISTS Track (
    id TEXT PRIMARY KEY,
    browser TEXT,
    device TEXT,
    eventName TEXT,
    location TEXT,
    referrer TEXT,
    url TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
