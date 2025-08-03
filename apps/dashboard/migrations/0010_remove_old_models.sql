-- Migration number: 0010 	 2025-08-03T00:13:01.828Z
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "bookmarks";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "todos";
PRAGMA foreign_keys=on;