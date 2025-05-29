-- Migration number: 0003 	 2025-05-29T22:20:29.491Z
PRAGMA defer_foreign_keys= ON;
PRAGMA foreign_keys= OFF;
CREATE TABLE "new_todos"
(
    "id"          TEXT NOT NULL PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    "title"       TEXT NOT NULL,
    "description" TEXT,
    "recurs"      INTEGER,
    "dueDate"     DATETIME
);
INSERT INTO "new_todos" ("description", "dueDate", "id", "recurs", "title", "userId")
SELECT "description", "dueDate", "id", "recurs", "title", "userId"
FROM "todos";
DROP TABLE "todos";
ALTER TABLE "new_todos"
    RENAME TO "todos";
CREATE INDEX "todos_id_userId_idx" ON "todos" ("id" ASC, "userId" ASC);
PRAGMA foreign_keys= ON;
PRAGMA defer_foreign_keys= OFF;