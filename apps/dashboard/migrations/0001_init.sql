-- Migration number: 0001 	 2025-05-16T20:35:55.967Z
CREATE TABLE users
(
    id TEXT PRIMARY KEY NOT NULL
);

CREATE TABLE bookmarks
(
    id     TEXT PRIMARY KEY NOT NULL,
    title  TEXT             NOT NULL,
    url    TEXT             NOT NULL,
    userId TEXT             NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
);
