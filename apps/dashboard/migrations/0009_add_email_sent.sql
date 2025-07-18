-- Migration number: 0009 	 2025-07-18T14:56:08.554Z
-- AlterTable
ALTER TABLE "applications" ADD COLUMN "dmSent" DATETIME;
ALTER TABLE "applications" ADD COLUMN "dmUrl" TEXT;