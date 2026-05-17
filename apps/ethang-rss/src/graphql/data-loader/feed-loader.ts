import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import keyBy from "lodash/keyBy.js";
import map from "lodash/map.js";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const createFeedLoader = (database: Database) => {
  return new DataLoader(async (ids: readonly string[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const idsArray = ids as string[];
    const feeds = await database
      .select()
      .from(databaseSchema.feedsTable)
      .where(inArray(databaseSchema.feedsTable.id, idsArray));
    const feedsById = keyBy(feeds, "id");
    return map(idsArray, (id) => {
      return feedsById[id] ?? null;
    });
  });
};
