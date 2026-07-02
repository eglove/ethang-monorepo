import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { DateTime } from "effect";
import { v7 } from "uuid";

export const generateId = () => {
  return v7();
};

export const modificationListTable = sqliteTable("modList", {
  createdAt: text("createdAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.formatIso(DateTime.unsafeNow());
    }),
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  updatedAt: text("updatedAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.formatIso(DateTime.unsafeNow());
    })
});

export const modificationTable = sqliteTable("mod", {
  createdAt: text("createdAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.formatIso(DateTime.unsafeNow());
    }),
  id: text("id").primaryKey().$defaultFn(generateId),
  modListId: text("modListId")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationListTable.id;
      },
      { onDelete: "cascade" }
    ),
  title: text("title").notNull(),
  updatedAt: text("updatedAt")
    .notNull()
    .$defaultFn(() => {
      return DateTime.formatIso(DateTime.unsafeNow());
    }),
  url: text("url").notNull()
});

export const requirementTable = sqliteTable("requirement", {
  id: text("id").primaryKey().$defaultFn(generateId),
  parentModId: text("parentModId")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationTable.id;
      },
      { onDelete: "cascade" }
    ),
  requiresModId: text("requiresModId")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationTable.id;
      },
      { onDelete: "cascade" }
    )
});

export const conflictTable = sqliteTable("conflict", {
  id: text("id").primaryKey().$defaultFn(generateId),
  modAId: text("modAId")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationTable.id;
      },
      { onDelete: "cascade" }
    ),
  modBId: text("modBId")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationTable.id;
      },
      { onDelete: "cascade" }
    )
});

export const patchTable = sqliteTable("patch", {
  id: text("id").primaryKey().$defaultFn(generateId),
  modAId: text("modAId")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationTable.id;
      },
      { onDelete: "cascade" }
    ),
  modBId: text("modBId")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationTable.id;
      },
      { onDelete: "cascade" }
    ),
  patchedById: text("patchedById")
    .notNull()
    .references(
      /* c8 ignore next 4 */
      () => {
        return modificationTable.id;
      },
      { onDelete: "cascade" }
    )
});
