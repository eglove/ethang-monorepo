-- Migration number: 0006 	 2025-07-17T00:23:56.391Z
-- RedefineTables
PRAGMA defer_foreign_keys= ON;
PRAGMA foreign_keys= OFF;
CREATE TABLE "new_Appearance"
(
    "id"                   TEXT    NOT NULL PRIMARY KEY,
    "name"                 TEXT    NOT NULL,
    "isGuest"         BOOLEAN NOT NULL DEFAULT false,
    "isBucketPull"         BOOLEAN NOT NULL DEFAULT false,
    "isRegular"            BOOLEAN NOT NULL DEFAULT false,
    "isHallOfFame"         BOOLEAN NOT NULL DEFAULT false,
    "isGoldenTicketWinner" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Appearance" ("id", "isBucketPull", "isGoldenTicketWinner", "isGuest", "isHallOfFame", "isRegular",
                              "name")
SELECT "id", "isBucketPull", "isGoldenTicketWinner", "isGuest", "isHallOfFame", "isRegular", "name"
FROM "Appearance";
DROP TABLE "Appearance";
ALTER TABLE "new_Appearance"
    RENAME TO "Appearance";
CREATE UNIQUE INDEX "Appearance_name_key" ON "Appearance" ("name");
PRAGMA foreign_keys= ON;
PRAGMA defer_foreign_keys= OFF;
