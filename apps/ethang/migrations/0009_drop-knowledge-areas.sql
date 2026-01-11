-- Migration number: 0009 	 2026-01-11T21:21:06.701Z
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "KnowledgeArea";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_CourseToKnowledgeArea";
PRAGMA foreign_keys=on;