import type { buildSchema } from "drizzle-graphql";
import type { DrizzleD1Database } from "drizzle-orm/d1";

import { eq } from "drizzle-orm";
import { GraphQLList, GraphQLNonNull } from "graphql/type/index.js";
import map from "lodash/map.js";

import type { ServerContext } from "../../index.ts";

// eslint-disable-next-line sonar/no-wildcard-import
import * as databaseSchema from "../../db/schema.ts";

type DatabaseSchema = typeof databaseSchema;

export const subscriptions = (
  database: DrizzleD1Database<DatabaseSchema>,
  entities: ReturnType<
    typeof buildSchema<DrizzleD1Database<DatabaseSchema>>
  >["entities"]
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
