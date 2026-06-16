import type { Database } from "../db/database-schema.ts";
import type { ServerContext } from "../index.ts";

import { addSubscriptionMutation } from "./mutations/add-subscription.ts";
import { markArticleReadMutation } from "./mutations/mark-article-read.ts";
import { allArticlesQuery } from "./queries/all-articles.ts";
import { feedArticlesQuery } from "./queries/feed-articles.ts";
import { subscriptionQuery } from "./queries/subscription.ts";
import { subscriptionsQuery } from "./queries/subscriptions.ts";

export const createResolvers = (database: Database) => {
  return {
    Article: {
      // eslint-disable-next-line sonar/function-name
      __resolveReference: async (
        reference: { id: string },
        context: ServerContext
      ) => {
        return context.articleLoader.load(reference.id);
      },
      feed: async (
        parent: { feedId: string },
        _parameters: unknown,
        context: ServerContext
      ) => {
        return context.feedLoader.load(parent.feedId);
      },
      isRead: async (
        parent: { id: string },
        _parameters: unknown,
        context: ServerContext
      ) => {
        const state = await context.userArticleStateLoader.load(parent.id);
        return state?.isRead ?? false;
      }
    },
    Feed: {
      // eslint-disable-next-line sonar/function-name
      __resolveReference: async (
        reference: { id: string },
        context: ServerContext
      ) => {
        return context.feedLoader.load(reference.id);
      },
      articles: async (
        parent: { id: string },
        parameters: { after?: string; first?: number; isRead?: boolean },
        context: ServerContext
      ) => {
        return feedArticlesQuery(database)(
          undefined,
          {
            ...parameters,
            feedId: parent.id
          },
          context
        );
      }
    },
    Mutation: {
      addSubscription: addSubscriptionMutation(database),
      markArticleRead: markArticleReadMutation(database)
    },
    Query: {
      allArticles: allArticlesQuery(database),
      feedArticles: feedArticlesQuery(database),
      subscription: subscriptionQuery(database),
      subscriptions: subscriptionsQuery(database)
    }
  };
};
