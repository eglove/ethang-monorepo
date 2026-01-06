-- CreateTable
CREATE TABLE "Path" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "pathId" TEXT NOT NULL,
    CONSTRAINT "Course_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeArea" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_CourseToKnowledgeArea" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_CourseToKnowledgeArea_A_fkey" FOREIGN KEY ("A") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_CourseToKnowledgeArea_B_fkey" FOREIGN KEY ("B") REFERENCES "KnowledgeArea" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Path_name_key" ON "Path"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Path_url_key" ON "Path"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Path_order_key" ON "Path"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Course_url_key" ON "Course"("url");

-- CreateIndex
CREATE UNIQUE INDEX "Course_order_key" ON "Course"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Course_author_name_key" ON "Course"("author", "name");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArea_name_key" ON "KnowledgeArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeArea_order_key" ON "KnowledgeArea"("order");

-- CreateIndex
CREATE UNIQUE INDEX "_CourseToKnowledgeArea_AB_unique" ON "_CourseToKnowledgeArea"("A", "B");

-- CreateIndex
CREATE INDEX "_CourseToKnowledgeArea_B_index" ON "_CourseToKnowledgeArea"("B");

