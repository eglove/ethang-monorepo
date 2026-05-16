import DataLoader from "dataloader";
import { inArray } from "drizzle-orm";
import keyBy from "lodash/keyBy.js";
import map from "lodash/map.js";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const createArticleLoader = (database: Database) => {
  return new DataLoader(async (ids: readonly string[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const idsArray = ids as string[];
    const articles = await database
      .select()
      .from(databaseSchema.articlesTable)
      .where(inArray(databaseSchema.articlesTable.id, idsArray));
    const articlesById = keyBy(articles, "id");
    return map(idsArray, (id) => {
      return articlesById[id] ?? null;
    });
  });
};
