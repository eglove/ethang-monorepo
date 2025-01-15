ALTER TABLE Comments
    RENAME TO Comments_old;

CREATE TABLE IF NOT EXISTS Comments
(
    id        TEXT PRIMARY KEY,
    url       TEXT                               NOT NULL,
    username  TEXT                               NOT NULL,
    message   TEXT                               NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO Comments (id, url, username, message, createdAt)
SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' ||
             substr(hex(randomblob(2)), 2) || '-a' ||
             substr(hex(randomblob(2)), 2) || '-' || hex(randomblob(6))),
       url,
       username,
       message,
       createdAt
FROM Comments_old;

DROP TABLE Comments_old;