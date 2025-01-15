DROP TABLE IF EXISTS Comments;
CREATE TABLE IF NOT EXISTS Comments
(
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    url       TEXT                               NOT NULL,
    username  TEXT                               NOT NULL,
    message   TEXT                               NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_url ON Comments(url);