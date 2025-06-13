-- Migration number: 0003 	 2025-06-13T20:58:49.454Z
-- AlterTable
ALTER TABLE "Project" ADD COLUMN "publicUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_publicUrl_key" ON "Project"("publicUrl");