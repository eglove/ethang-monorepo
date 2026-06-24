import { eq } from "drizzle-orm";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const subscriptionQuery = async (
  database: Database,
  parameters: { feedId: string }
) => {
  const { feedId } = parameters;

  const [feed] = await database
    .select()
    .from(databaseSchema.feedsTable)
    .where(eq(databaseSchema.feedsTable.id, feedId))
    .limit(1);

  return feed ?? null;
};
