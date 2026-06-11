import { eq } from "drizzle-orm";
import get from "lodash/get.js";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const subscriptionQuery = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: { feedId: string },
    context: ServerContext
  ) => {
    const { feedId } = parameters;

    const feed = await database
      .select()
      .from(databaseSchema.feedsTable)
      .where(eq(databaseSchema.feedsTable.id, feedId))
      .limit(1);

    return context.feedLoader.load(get(feed, [0, "id"]));
  };
};
