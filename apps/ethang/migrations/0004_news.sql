-- Migration number: 0004 	 2025-06-13T21:59:12.745Z
-- CreateTable
CREATE TABLE "News"
(
    "id"        TEXT     NOT NULL PRIMARY KEY,
    "href"      TEXT     NOT NULL,
    "published" DATETIME NOT NULL,
    "quote"     TEXT,
    "title"     TEXT     NOT NULL
);

-- CreateTable
CREATE TABLE "YouTubeVideo"
(
    "id"      TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "title"   TEXT NOT NULL,
    "url"     TEXT NOT NULL,
    CONSTRAINT "YouTubeVideo_id_fkey" FOREIGN KEY ("id") REFERENCES "News" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "YouTubeVideo_videoId_key" ON "YouTubeVideo" ("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "YouTubeVideo_url_key" ON "YouTubeVideo" ("url");