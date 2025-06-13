-- Migration number: 0005 	 2025-06-13T22:32:42.814Z
-- RedefineTables
PRAGMA defer_foreign_keys= ON;
PRAGMA foreign_keys= OFF;
CREATE TABLE "new_YouTubeVideo"
(
    "id"      TEXT NOT NULL PRIMARY KEY,
    "videoId" TEXT NOT NULL,
    "title"   TEXT NOT NULL,
    "url"     TEXT NOT NULL,
    "newsId"  TEXT NOT NULL,
    CONSTRAINT "YouTubeVideo_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_YouTubeVideo" ("id", "title", "url", "videoId")
SELECT "id", "title", "url", "videoId"
FROM "YouTubeVideo";
DROP TABLE "YouTubeVideo";
ALTER TABLE "new_YouTubeVideo"
    RENAME TO "YouTubeVideo";
CREATE UNIQUE INDEX "YouTubeVideo_videoId_key" ON "YouTubeVideo" ("videoId");
CREATE UNIQUE INDEX "YouTubeVideo_url_key" ON "YouTubeVideo" ("url");
CREATE UNIQUE INDEX "YouTubeVideo_newsId_key" ON "YouTubeVideo" ("newsId");
PRAGMA foreign_keys= ON;
PRAGMA defer_foreign_keys= OFF;