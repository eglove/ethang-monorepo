-- Migration number: 0002 	 2025-05-27T15:37:28.929Z
CREATE TABLE "todos"
(
    "id"          TEXT NOT NULL PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "recurs"      INTEGER,
    "dueDate"     DATETIME
);

CREATE INDEX "todos_id_userId_idx" ON "todos"("id", "userId");