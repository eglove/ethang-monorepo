import { createDatabaseClient } from './db/client.js';
import { articlesTable, feedsTable } from './schema.js';
import { fetchAndParseRss } from './utils/rss-parser.js';
import { v7 } from 'uuid';
import { eq } from 'drizzle-orm';

export const runCron = async (d1: D1Database) => {
  const database = createDatabaseClient(d1);
  const feeds = await database.select().from(feedsTable);

  for (const feed of feeds) {
    const articles = await fetchAndParseRss(feed.url);

    for (const article of articles) {
      const existingArticle = await database
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.url, article.url))
        .get();

      if (!existingArticle) {
        await database.insert(articlesTable).values({
          id: v7(),
          feedId: feed.id,
          title: article.title,
          url: article.url,
          content: article.content,
          publishedAt: article.publishedAt,
        });
      }
    }
  }
};
