import { eq } from "drizzle-orm";
import { GraphQLList, GraphQLNonNull } from "graphql/type/index.js";
import map from "lodash/map.js";

import type { ServerContext } from "../../index.ts";

import {
  type Database,
  type DatabaseEntities,
  databaseSchema
} from "../../db/database-schema.ts";

export const subscriptions = (
  database: Database,
  entities: DatabaseEntities
) => {
  return {
    resolve: async (_: unknown, __: unknown, context: ServerContext) => {
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
        .where(eq(databaseSchema.subscriptionsTable.userId, context.user.sub));

      return map(results, (result) => {
        return result.feed;
      });
    },
    type: new GraphQLList(new GraphQLNonNull(entities.types.FeedsTableItem))
  };
};
