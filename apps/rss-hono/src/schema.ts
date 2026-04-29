import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { v7 } from 'uuid';

export const feedsTable = sqliteTable('feeds', {
  description: text('description'),
  icon: text('icon'),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => {
      return v7();
    }),
  name: text('name').notNull(),
  url: text('url').notNull().unique(),
});

export const articlesTable = sqliteTable('articles', {
  content: text('content'),
  feedId: text('feed_id')
    .notNull()
    .references(() => {
      return feedsTable.id;
    }, { onDelete: 'cascade' }),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => {
      return v7();
    }),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  title: text('title').notNull(),
  url: text('url').notNull().unique(),
});

export const userSubscriptionsTable = sqliteTable('user_subscriptions', {
  category: text('category'),
  feedId: text('feed_id')
    .notNull()
    .references(() => {
      return feedsTable.id;
    }, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
});

export const userArticleInteractionsTable = sqliteTable(
  'user_article_interactions',
  {
    articleId: text('article_id')
      .notNull()
      .references(() => {
        return articlesTable.id;
      }, { onDelete: 'cascade' }),
    isRead: integer('is_read', { mode: 'boolean' }).notNull().default(false),
    isSaved: integer('is_saved', { mode: 'boolean' }).notNull().default(false),
    userId: text('user_id').notNull(),
  }
);
