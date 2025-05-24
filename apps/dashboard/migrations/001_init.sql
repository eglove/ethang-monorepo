-- CreateTable
CREATE TABLE if not exists "bookmarks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE if not exists "applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "applied" DATETIME NOT NULL,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "rejected" DATETIME,
    "interviewRounds" TEXT
);

-- CreateTable
CREATE TABLE if not exists "contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "linkedIn" TEXT,
    "lastContact" DATETIME NOT NULL,
    "expectedNextContact" DATETIME
);

-- CreateTable
CREATE TABLE if not exists "questionAnswers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "question" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX if not exists "applications_id_userId_idx" ON "applications"("id", "userId");

-- CreateIndex
CREATE INDEX if not exists "contacts_id_userId_idx" ON "contacts"("id", "userId");

-- CreateIndex
CREATE INDEX if not exists "questionAnswers_id_userId_idx" ON "questionAnswers"("id", "userId");


