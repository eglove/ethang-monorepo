-- Migration number: 0002 	 2025-07-16T03:35:03.603Z
-- CreateTable
CREATE TABLE "Episode"
(
    "number"      INTEGER  NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title"       TEXT     NOT NULL,
    "url"         TEXT     NOT NULL,
    "publishDate" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Appearance"
(
    "id"       TEXT NOT NULL PRIMARY KEY,
    "name"     TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "type"     TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AppearanceToEpisode"
(
    "A" TEXT    NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_AppearanceToEpisode_A_fkey" FOREIGN KEY ("A") REFERENCES "Appearance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AppearanceToEpisode_B_fkey" FOREIGN KEY ("B") REFERENCES "Episode" ("number") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Episode_number_key" ON "Episode" ("number");

-- CreateIndex
CREATE UNIQUE INDEX "_AppearanceToEpisode_AB_unique" ON "_AppearanceToEpisode" ("A", "B");

-- CreateIndex
CREATE INDEX "_AppearanceToEpisode_B_index" ON "_AppearanceToEpisode" ("B");