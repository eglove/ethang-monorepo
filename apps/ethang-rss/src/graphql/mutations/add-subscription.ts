import { eq } from "drizzle-orm";
import { GraphQLNonNull, GraphQLString } from "graphql/type/index.js";
import isNil from "lodash/isNil.js";

import type { ServerContext } from "../../index.ts";

import {
  type Database,
  type DatabaseEntities,
  databaseSchema
} from "../../db/database-schema.ts";

export const addSubscription = (
  database: Database,
  entities: DatabaseEntities
) => {
  return {
    args: {
      title: { type: new GraphQLNonNull(GraphQLString) },
      website: { type: new GraphQLNonNull(GraphQLString) },
      xmlAddress: { type: new GraphQLNonNull(GraphQLString) }
    },
    resolve: async (
      _: unknown,
      parameters: { title: string; website: string; xmlAddress: string },
      context: ServerContext
    ) => {
      let [feed] = await database
        .select()
        .from(databaseSchema.feedsTable)
        .where(eq(databaseSchema.feedsTable.xmlAddress, parameters.xmlAddress));

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
    },
    type: new GraphQLNonNull(entities.types.FeedsTableItem)
  };
};
