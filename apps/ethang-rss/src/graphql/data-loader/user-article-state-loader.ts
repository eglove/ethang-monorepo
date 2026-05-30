import DataLoader from "dataloader";
import { and, eq, inArray } from "drizzle-orm";
import keyBy from "lodash/keyBy.js";
import map from "lodash/map.js";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const createUserArticleStateLoader = (
  database: Database,
  userId: string
) => {
  return new DataLoader(async (articleIds: readonly string[]) => {
    const idsArray = [...articleIds];
    const states = await database
      .select()
      .from(databaseSchema.userItemStatesTable)
      .where(
        and(
          eq(databaseSchema.userItemStatesTable.userId, userId),
          inArray(databaseSchema.userItemStatesTable.articleId, idsArray)
        )
      );
    const statesByArticleId = keyBy(states, "articleId");
    return map(idsArray, (id) => {
      return statesByArticleId[id] ?? null;
    });
  });
};
