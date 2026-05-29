import type { Database } from "../db/database-schema.ts";
import type { ServerContext } from "../index.ts";

import { addSubscriptionMutation } from "./mutations/add-subscription.ts";
import { feedArticlesQuery } from "./queries/feed-articles.ts";
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
        parameters: { after?: string; first?: number }
      ) => {
        return feedArticlesQuery(database)(undefined, {
          ...parameters,
          feedId: parent.id
        });
      }
    },
    Mutation: {
      addSubscription: addSubscriptionMutation(database)
    },
    Query: {
      feedArticles: feedArticlesQuery(database),
      subscriptions: subscriptionsQuery(database)
    }
  };
};
