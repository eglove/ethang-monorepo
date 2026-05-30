import { eq } from "drizzle-orm";
import isNil from "lodash/isNil.js";

import type { ServerContext } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const markArticleReadMutation = (database: Database) => {
  return async (
    _parent: unknown,
    parameters: { articleId: string; isRead: boolean },
    context: unknown
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const serverContext = context as ServerContext;
    const userId = serverContext.user.sub;

    await database
      .insert(databaseSchema.userItemStatesTable)
      .values({
        articleId: parameters.articleId,
        isRead: parameters.isRead,
        userId
      })
      .onConflictDoUpdate({
        set: {
          isRead: parameters.isRead
        },
        target: [
          databaseSchema.userItemStatesTable.userId,
          databaseSchema.userItemStatesTable.articleId
        ]
      });

    const [article] = await database
      .select()
      .from(databaseSchema.articlesTable)
      .where(eq(databaseSchema.articlesTable.id, parameters.articleId));

    if (isNil(article)) {
      throw new Error("Article not found");
    }

    return article;
  };
};
