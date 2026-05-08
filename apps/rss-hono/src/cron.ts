import map from "lodash/map.js";
import { v7 } from 'uuid';

import { createDatabaseClient } from './db/client.js';
import { articlesTable, feedsTable } from './schema.js';
import { fetchAndParseRss } from './utils/rss-parser.js';

export const runCron = async (d1: D1Database) => {
  const database = createDatabaseClient(d1);
  const feeds = await database.select().from(feedsTable);

  const feedResults = await Promise.all(
      map(feeds, async (feed) => {
        const articles = await fetchAndParseRss(feed.url);
        // Transform articles into the database schema format immediately
        return map(articles, (article) => {return {
          content: article.content,
          feedId: feed.id,
          id: v7(),
          publishedAt: article.publishedAt,
          title: article.title,
          url: article.url,
        }});
      })
  );

  const allArticles = feedResults.flat();

  if (0 < allArticles.length) {
    await database
        .insert(articlesTable)
        .values(allArticles)
        .onConflictDoNothing({ target: articlesTable.url });
  }
};
