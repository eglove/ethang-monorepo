-- Migration number: 0005 	 2025-05-29T22:54:14.975Z
-- CreateTable
CREATE TABLE "interviewRounds"
(
    "id"             TEXT     NOT NULL PRIMARY KEY,
    "dateTime"       DATETIME NOT NULL,
    "applicationsId" TEXT,
    CONSTRAINT "interviewRounds_applicationsId_fkey" FOREIGN KEY ("applicationsId") REFERENCES "applications" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA
defer_foreign_keys=ON;
PRAGMA
foreign_keys=OFF;
CREATE TABLE "new_applications"
(
    "id"       TEXT     NOT NULL PRIMARY KEY,
    "userId"   TEXT     NOT NULL,
    "applied"  DATETIME NOT NULL,
    "company"  TEXT     NOT NULL,
    "title"    TEXT     NOT NULL,
    "url"      TEXT     NOT NULL,
    "rejected" DATETIME
);
INSERT INTO "new_applications" ("applied", "company", "id", "rejected", "title", "url", "userId")
SELECT "applied", "company", "id", "rejected", "title", "url", "userId"
FROM "applications";
DROP TABLE "applications";
ALTER TABLE "new_applications" RENAME TO "applications";
CREATE INDEX "applications_id_userId_idx" ON "applications" ("id", "userId");
PRAGMA
foreign_keys=ON;
PRAGMA
defer_foreign_keys=OFF;