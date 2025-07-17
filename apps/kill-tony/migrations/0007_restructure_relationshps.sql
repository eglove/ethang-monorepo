-- DropIndex
DROP INDEX "_AppearanceToEpisode_B_index";

-- DropIndex
DROP INDEX "_AppearanceToEpisode_AB_unique";

-- DropTable
PRAGMA foreign_keys= off;
DROP TABLE "_AppearanceToEpisode";
PRAGMA foreign_keys= on;

-- CreateTable
CREATE TABLE "_EpisodeGuests"
(
    "A" TEXT    NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_EpisodeGuests_A_fkey" FOREIGN KEY ("A") REFERENCES "Appearance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EpisodeGuests_B_fkey" FOREIGN KEY ("B") REFERENCES "Episode" ("number") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EpisodeRegulars"
(
    "A" TEXT    NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_EpisodeRegulars_A_fkey" FOREIGN KEY ("A") REFERENCES "Appearance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EpisodeRegulars_B_fkey" FOREIGN KEY ("B") REFERENCES "Episode" ("number") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EpisodeGoldenTicketCashIns"
(
    "A" TEXT    NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_EpisodeGoldenTicketCashIns_A_fkey" FOREIGN KEY ("A") REFERENCES "Appearance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EpisodeGoldenTicketCashIns_B_fkey" FOREIGN KEY ("B") REFERENCES "Episode" ("number") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_EpisodeBucketPulls"
(
    "A" TEXT    NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_EpisodeBucketPulls_A_fkey" FOREIGN KEY ("A") REFERENCES "Appearance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_EpisodeBucketPulls_B_fkey" FOREIGN KEY ("B") REFERENCES "Episode" ("number") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys= ON;
PRAGMA foreign_keys= OFF;
CREATE TABLE "new_Appearance"
(
    "id"           TEXT    NOT NULL PRIMARY KEY,
    "name"         TEXT    NOT NULL,
    "isHallOfFame" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Appearance" ("id", "isHallOfFame", "name")
SELECT "id", "isHallOfFame", "name"
FROM "Appearance";
DROP TABLE "Appearance";
ALTER TABLE "new_Appearance"
    RENAME TO "Appearance";
CREATE UNIQUE INDEX "Appearance_name_key" ON "Appearance" ("name");
PRAGMA foreign_keys= ON;
PRAGMA defer_foreign_keys= OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_EpisodeGuests_AB_unique" ON "_EpisodeGuests" ("A", "B");

-- CreateIndex
CREATE INDEX "_EpisodeGuests_B_index" ON "_EpisodeGuests" ("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EpisodeRegulars_AB_unique" ON "_EpisodeRegulars" ("A", "B");

-- CreateIndex
CREATE INDEX "_EpisodeRegulars_B_index" ON "_EpisodeRegulars" ("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EpisodeGoldenTicketCashIns_AB_unique" ON "_EpisodeGoldenTicketCashIns" ("A", "B");

-- CreateIndex
CREATE INDEX "_EpisodeGoldenTicketCashIns_B_index" ON "_EpisodeGoldenTicketCashIns" ("B");

-- CreateIndex
CREATE UNIQUE INDEX "_EpisodeBucketPulls_AB_unique" ON "_EpisodeBucketPulls" ("A", "B");

-- CreateIndex
CREATE INDEX "_EpisodeBucketPulls_B_index" ON "_EpisodeBucketPulls" ("B");