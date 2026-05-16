import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import groupBy from "lodash/groupBy.js";
import map from "lodash/map.js";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const createArticlesByFeedIdLoader = (database: Database) => {
  return new DataLoader(async (feedIds: readonly string[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const feedIdsArray = feedIds as string[];
    const articles = await database
      .select()
      .from(databaseSchema.articlesTable)
      .where(inArray(databaseSchema.articlesTable.feedId, feedIdsArray));
    const articlesByFeedId = groupBy(articles, "feedId");
    return map(feedIdsArray, (feedId) => {
      return articlesByFeedId[feedId] ?? [];
    });
  });
};
