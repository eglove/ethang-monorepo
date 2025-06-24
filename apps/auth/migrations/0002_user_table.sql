-- Migration number: 0002 	 2025-06-24T19:39:00.247Z
-- CreateTable
CREATE TABLE "User"
(
    "id"           TEXT     NOT NULL PRIMARY KEY,
    "email"        TEXT     NOT NULL,
    "username"     TEXT     NOT NULL,
    "password"     TEXT     NOT NULL,
    "lastLoggedIn" DATETIME,
    "role"         TEXT,
    "updatedAt"    DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User" ("username");