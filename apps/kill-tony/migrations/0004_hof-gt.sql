-- Migration number: 0004 	 2025-07-16T04:04:49.505Z
-- RedefineTables
PRAGMA defer_foreign_keys= ON;
PRAGMA foreign_keys= OFF;
CREATE TABLE "new_Appearance"
(
    "id"                   TEXT    NOT NULL PRIMARY KEY,
    "name"                 TEXT    NOT NULL,
    "imageUrl"             TEXT    NOT NULL,
    "type"                 TEXT    NOT NULL,
    "isHallOfFame"         BOOLEAN NOT NULL DEFAULT false,
    "isGoldenTicketWinner" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Appearance" ("id", "imageUrl", "name", "type")
SELECT "id", "imageUrl", "name", "type"
FROM "Appearance";
DROP TABLE "Appearance";
ALTER TABLE "new_Appearance"
    RENAME TO "Appearance";
CREATE UNIQUE INDEX "Appearance_name_key" ON "Appearance" ("name");
PRAGMA foreign_keys= ON;
PRAGMA defer_foreign_keys= OFF;