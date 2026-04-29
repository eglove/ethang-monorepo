import { drizzle } from 'drizzle-orm/d1';

import { articlesTable, feedsTable, userArticleInteractionsTable, userSubscriptionsTable } from '../schema.js';

export const createDatabaseClient = (d1: D1Database) => {
  return drizzle(d1, { schema: { articlesTable, feedsTable, userArticleInteractionsTable, userSubscriptionsTable } });
};
