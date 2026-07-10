import { and, eq } from "drizzle-orm";
import { Effect } from "effect";
import isEmpty from "lodash/isEmpty.js";
import trim from "lodash/trim.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const removeSubscriptionMutation = async (
  database: Database,
  parameters: { feedId: string },
  user: User
) => {
  const feedId = trim(parameters.feedId);

  if (isEmpty(feedId)) {
    Effect.runSync(Effect.die(new Error("feedId is required")));
  }

  await database
    .delete(databaseSchema.subscriptionsTable)
    .where(
      and(
        eq(databaseSchema.subscriptionsTable.userId, user.sub),
        eq(databaseSchema.subscriptionsTable.feedId, feedId)
      )
    );
};
