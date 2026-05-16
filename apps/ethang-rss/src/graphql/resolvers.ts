import type { Database } from "../db/database-schema.ts";

import { createArticleLoader } from "./data-loader/article-loader.ts";
import { createArticlesByFeedIdLoader } from "./data-loader/articles-by-feed-id-loader.ts";
import { createFeedLoader } from "./data-loader/feed-loader.ts";
import { addSubscriptionMutation } from "./mutations/add-subscription.ts";
import { feedArticlesQuery } from "./queries/feed-articles.ts";
import { subscriptionsQuery } from "./queries/subscriptions.ts";

export const createResolvers = (database: Database) => {
  const feedLoader = createFeedLoader(database);
  const articleLoader = createArticleLoader(database);
  const articlesByFeedIdLoader = createArticlesByFeedIdLoader(database);

  return {
    Article: {
      // eslint-disable-next-line sonar/function-name
      __resolveReference: async (reference: { id: string }) => {
        return articleLoader.load(reference.id);
      }
    },
    Feed: {
      // eslint-disable-next-line sonar/function-name
      __resolveReference: async (reference: { id: string }) => {
        return feedLoader.load(reference.id);
      },
      articles: async (parent: { id: string }) => {
        return articlesByFeedIdLoader.load(parent.id);
      }
    },
    Mutation: {
      addSubscription: addSubscriptionMutation(database)
    },
    Query: {
      feedArticles: feedArticlesQuery(articlesByFeedIdLoader),
      subscriptions: subscriptionsQuery(database, feedLoader)
    }
  };
};
