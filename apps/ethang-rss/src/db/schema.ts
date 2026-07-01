import { relations } from "drizzle-orm";
import { integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { DateTime } from "effect";
import { v7 } from "uuid";

const uuidId = text()
  .primaryKey()
  .$defaultFn(() => {
    return v7();
  });

export const feedsTable = sqliteTable("feeds", {
  id: uuidId,
  lastFetchedAt: text(),
  title: text().notNull(),
  website: text().notNull(),
  xmlAddress: text().unique().notNull()
});

export const feedsRelations = relations(feedsTable, ({ many }) => {
  return {
    articles: many(articlesTable),
    subscriptions: many(subscriptionsTable)
  };
});

export const articlesTable = sqliteTable(
  "articles",
  {
    content: text(),
    feedId: text()
      .notNull()
      .references(
        () => {
          return feedsTable.id;
        },
        { onDelete: "cascade" }
      ),
    guid: text().notNull(),
    id: uuidId,
    link: text().notNull(),
    publishedAt: text(),
    title: text().notNull()
  },
  (table) => {
    return [unique("articles_feed_guid_unique").on(table.feedId, table.guid)];
  }
);

export const articlesRelations = relations(articlesTable, ({ many, one }) => {
  return {
    feed: one(feedsTable, {
      fields: [articlesTable.feedId],
      references: [feedsTable.id]
    }),
    userStates: many(userItemStatesTable)
  };
});

export const subscriptionsTable = sqliteTable(
  "subscriptions",
  {
    createdAt: text().$defaultFn(() => {
      return DateTime.formatIso(DateTime.unsafeNow());
    }),
    feedId: text()
      .notNull()
      .references(() => {
        return feedsTable.id;
      }),
    id: uuidId,
    userId: text().notNull()
  },
  (table) => {
    return [
      unique("subscriptions_user_feed_unique").on(table.userId, table.feedId)
    ];
  }
);

export const subscriptionsRelations = relations(
  subscriptionsTable,
  ({ one }) => {
    return {
      feed: one(feedsTable, {
        fields: [subscriptionsTable.feedId],
        references: [feedsTable.id]
      })
    };
  }
);

export const userItemStatesTable = sqliteTable(
  "user_item_states",
  {
    articleId: text()
      .notNull()
      .references(() => {
        return articlesTable.id;
      }),
    id: uuidId,
    isBookmarked: integer({ mode: "boolean" }).default(false),
    isRead: integer({ mode: "boolean" }).default(false),
    userId: text().notNull()
  },
  (table) => {
    return [
      unique("user_item_article_unique").on(table.userId, table.articleId)
    ];
  }
);

export const userItemStatesRelations = relations(
  userItemStatesTable,
  ({ one }) => {
    return {
      article: one(articlesTable, {
        fields: [userItemStatesTable.articleId],
        references: [articlesTable.id]
      })
    };
  }
);
