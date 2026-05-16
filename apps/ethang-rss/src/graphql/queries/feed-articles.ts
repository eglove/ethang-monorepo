import type DataLoader from "dataloader";

import map from "lodash/map.js";

import type { databaseSchema } from "../../db/database-schema.ts";

type Article = typeof databaseSchema.articlesTable.$inferSelect;

export const feedArticlesQuery = (
  articlesByFeedIdLoader: DataLoader<string, Article[] | null>
) => {
  return async (_parent: unknown, parameters: { feedId: string }) => {
    const articles = await articlesByFeedIdLoader.load(parameters.feedId);

    return map(articles, (article) => {
      return {
        __typename: "Article",
        ...article
      };
    });
  };
};
