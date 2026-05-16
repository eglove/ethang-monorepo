import { eq } from "drizzle-orm";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import type { ServerContext } from "../index.ts";

import { type Database, databaseSchema } from "../db/database-schema.ts";

export const createResolvers = (database: Database) => {
  return {
    Article: {
      // eslint-disable-next-line sonar/function-name
      __resolveReference: async (reference: { id: string }) => {
        const [article] = await database
          .select()
          .from(databaseSchema.articlesTable)
          .where(eq(databaseSchema.articlesTable.id, reference.id));

        return article;
      }
    },
    Feed: {
      // eslint-disable-next-line sonar/function-name
      __resolveReference: async (reference: { id: string }) => {
        const [feed] = await database
          .select()
          .from(databaseSchema.feedsTable)
          .where(eq(databaseSchema.feedsTable.id, reference.id));

        return feed;
      },
      articles: async (parent: { id: string }) => {
        return database
          .select()
          .from(databaseSchema.articlesTable)
          .where(eq(databaseSchema.articlesTable.feedId, parent.id));
      }
    },
    Mutation: {
      addSubscription: async (
        _parent: unknown,
        parameters: { title: string; website: string; xmlAddress: string },
        context: ServerContext
      ) => {
        let [feed] = await database
          .select()
          .from(databaseSchema.feedsTable)
          .where(
            eq(databaseSchema.feedsTable.xmlAddress, parameters.xmlAddress)
          );

        if (isNil(feed)) {
          [feed] = await database
            .insert(databaseSchema.feedsTable)
            .values({
              title: parameters.title,
              website: parameters.website,
              xmlAddress: parameters.xmlAddress
            })
            .returning();
        }

        if (isNil(feed)) {
          throw new Error("Unable to insert feed");
        }

        await database
          .insert(databaseSchema.subscriptionsTable)
          .values({
            feedId: feed.id,
            userId: context.user.sub
          })
          .onConflictDoNothing();

        return feed;
      }
    },
    Query: {
      subscriptions: async (
        _parent: unknown,
        _arguments: unknown,
        context: ServerContext
      ) => {
        const results = await database
          .select({
            feed: databaseSchema.feedsTable
          })
          .from(databaseSchema.subscriptionsTable)
          .innerJoin(
            databaseSchema.feedsTable,
            eq(
              databaseSchema.subscriptionsTable.feedId,
              databaseSchema.feedsTable.id
            )
          )
          .where(
            eq(databaseSchema.subscriptionsTable.userId, context.user.sub)
          );

        return map(results, (result) => {
          return result.feed;
        });
      }
    }
  };
};
