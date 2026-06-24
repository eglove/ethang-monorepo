import { eq } from "drizzle-orm";
import isNil from "lodash/isNil.js";

import type { User } from "../../index.ts";

import { type Database, databaseSchema } from "../../db/database-schema.ts";

export const markArticleReadMutation = async (
  database: Database,
  parameters: { articleId: string; isRead: boolean },
  user: User
) => {
  const userId = user.sub;

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
