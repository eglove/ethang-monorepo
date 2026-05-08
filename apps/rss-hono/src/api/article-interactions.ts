import {requireAuth} from "@ethang/hono-middleware/src/auth/require-auth";
import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import { createDatabaseClient } from '../db/client.js'; 
import { userArticleInteractionsTable } from '../schema.js';

export const articleInteractionsApi = new Hono<{ Bindings: { DB: D1Database }; Variables: { user: { id: string } } }>();

const interactionSchema = z.object({
  isRead: z.boolean().optional(),
  isSaved: z.boolean().optional(),
});

articleInteractionsApi.use('/*', requireAuth());

articleInteractionsApi.post('/:articleId', async c => {
  const database = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const articleId = c.req.param('articleId');
  const body: unknown = await c.req.json();
  const parsed = interactionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid data' }, 400);
  }

  const existingInteraction = await database
    .select()
    .from(userArticleInteractionsTable)
    .where(and(eq(userArticleInteractionsTable.userId, user.id), eq(userArticleInteractionsTable.articleId, articleId)))
    .get();

  if (existingInteraction !== undefined) {
    const isRead = parsed.data.isRead ?? existingInteraction.isRead;
    const isSaved = parsed.data.isSaved ?? existingInteraction.isSaved;

    await database
      .update(userArticleInteractionsTable)
      .set({ isRead, isSaved })
      .where(and(eq(userArticleInteractionsTable.userId, user.id), eq(userArticleInteractionsTable.articleId, articleId)));

    return c.json({ articleId, isRead, isSaved, userId: user.id }, 200);
  }

  const isRead = parsed.data.isRead ?? false;
  const isSaved = parsed.data.isSaved ?? false;

  const newInteraction = {
    articleId,
    isRead,
    isSaved,
    userId: user.id,
  };

  await database.insert(userArticleInteractionsTable).values(newInteraction);

  return c.json(newInteraction, 201);
});
