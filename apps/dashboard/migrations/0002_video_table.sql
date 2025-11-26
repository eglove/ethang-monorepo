-- Migration number: 0002 	 2025-11-26T21:20:53.489Z
-- CreateTable
CREATE TABLE "Video"
(
    "id"         TEXT     NOT NULL PRIMARY KEY,
    "hasWatched" BOOLEAN  NOT NULL DEFAULT false,
    "published"  DATETIME NOT NULL,
    "title"      TEXT     NOT NULL,
    "url"        TEXT     NOT NULL,
    "authorName" TEXT     NOT NULL
);