-- Migration number: 0005 	 2025-07-16T20:44:09.694Z
-- RedefineTables
PRAGMA defer_foreign_keys= ON;
PRAGMA foreign_keys= OFF;
CREATE TABLE "new_Appearance"
(
    "id"                   TEXT    NOT NULL PRIMARY KEY,
    "name"                 TEXT    NOT NULL,
    "imageUrl"             TEXT    NOT NULL,
    "isGuest"              BOOLEAN NOT NULL DEFAULT false,
    "isBucketPull"         BOOLEAN NOT NULL DEFAULT false,
    "isRegular"            BOOLEAN NOT NULL DEFAULT false,
    "isHallOfFame"         BOOLEAN NOT NULL DEFAULT false,
    "isGoldenTicketWinner" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Appearance" ("id", "imageUrl", "isGoldenTicketWinner", "isHallOfFame", "name")
SELECT "id", "imageUrl", "isGoldenTicketWinner", "isHallOfFame", "name"
FROM "Appearance";
DROP TABLE "Appearance";
ALTER TABLE "new_Appearance"
    RENAME TO "Appearance";
CREATE UNIQUE INDEX "Appearance_name_key" ON "Appearance" ("name");
PRAGMA foreign_keys= ON;
PRAGMA defer_foreign_keys= OFF;