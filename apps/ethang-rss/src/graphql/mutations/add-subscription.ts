import { eq } from "drizzle-orm";
import isNil from "lodash/isNil.js";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const addSubscriptionMutation = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: { title: string; website: string; xmlAddress: string },
    context: unknown
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const serverContext = context as ServerContext;
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
        userId: serverContext.user.sub
      })
      .onConflictDoNothing();

    return feed;
  };
};
