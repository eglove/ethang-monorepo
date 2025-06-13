-- Migration number: 0002 	 2025-06-13T20:19:55.963Z
-- CreateTable
CREATE TABLE "Project"
(
    "id"          TEXT NOT NULL PRIMARY KEY,
    "code"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "title"       TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Tech"
(
    "id"   TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_ProjectToTech"
(
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProjectToTech_A_fkey" FOREIGN KEY ("A") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectToTech_B_fkey" FOREIGN KEY ("B") REFERENCES "Tech" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_code_key" ON "Project" ("code");

-- CreateIndex
CREATE UNIQUE INDEX "Project_title_key" ON "Project" ("title");

-- CreateIndex
CREATE UNIQUE INDEX "Tech_name_key" ON "Tech" ("name");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectToTech_AB_unique" ON "_ProjectToTech" ("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectToTech_B_index" ON "_ProjectToTech" ("B");