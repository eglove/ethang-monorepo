import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { DateTime } from "luxon";
import { v7 } from "uuid";

export const generateCourseTrackingId = () => {
  return v7();
};

export const generateId = () => {
  return v7();
};

export const courseTrackingTable = sqliteTable("courseTracking", {
  courseUrl: text("courseUrl").notNull(),
  id: text("id").primaryKey().$defaultFn(generateCourseTrackingId),
  status: text("status").notNull(),
  userId: text("userId").notNull()
});

export const coursesTable = sqliteTable("courses", {
  author: text("author").notNull(),
  createdAt: text("createdAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.now().toISO();
    }),
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  updatedAt: text("updatedAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.now().toISO();
    }),
  url: text("url").notNull()
});

export const learningPathsTable = sqliteTable("learning_paths", {
  createdAt: text("createdAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.now().toISO();
    }),
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  swebokFocus: text("swebokFocus").notNull(),
  updatedAt: text("updatedAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.now().toISO();
    }),
  url: text("url")
});

export const learningPathCoursesTable = sqliteTable("learning_path_courses", {
  courseId: text("courseId")
    .notNull()
    .references(
      () => {
        return coursesTable.id;
      },
      { onDelete: "cascade" }
    ),
  createdAt: text("createdAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.now().toISO();
    }),
  id: text("id").primaryKey().$defaultFn(generateId),
  learningPathId: text("learningPathId")
    .notNull()
    .references(
      () => {
        return learningPathsTable.id;
      },
      { onDelete: "cascade" }
    ),
  orderRank: integer("orderRank").notNull() // For maintaining order of courses in learning paths
});

export const curriculumsTable = sqliteTable("curriculums", {
  createdAt: text("createdAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.now().toISO();
    }),
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  updatedAt: text("updatedAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.now().toISO();
    }),
  url: text("url")
});

export const curriculumLearningPathsTable = sqliteTable(
  "curriculum_learning_paths",
  {
    createdAt: text("createdAt")
      .notNull()
      .$defaultFn(() => {
        return DateTime.now().toISO();
      }),
    curriculumId: text("curriculumId")
      .notNull()
      .references(
        () => {
          return curriculumsTable.id;
        },
        { onDelete: "cascade" }
      ),
    id: text("id").primaryKey().$defaultFn(generateId),
    learningPathId: text("learningPathId")
      .notNull()
      .references(
        () => {
          return learningPathsTable.id;
        },
        { onDelete: "cascade" }
      ),
    orderRank: integer("orderRank").notNull() // For maintaining order of learning paths in curriculums
  }
);
