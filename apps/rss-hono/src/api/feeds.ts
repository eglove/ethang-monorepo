import { requireAuth } from '@ethang/hono-middleware';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { v7 } from 'uuid';
import { z } from 'zod';

import { createDatabaseClient } from '../db/client.js';
import { feedsTable } from '../schema.js';

export const feedsApi = new Hono<{ Bindings: { DB: D1Database } }>();

const createFeedSchema = z.object({
  description: z.string().optional(),
  // eslint-disable-next-line @typescript-eslint/no-deprecated, sonar/deprecation
  icon: z.string().url().optional(),
  name: z.string(),
  // eslint-disable-next-line @typescript-eslint/no-deprecated, sonar/deprecation
  url: z.string().url(),
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
feedsApi.use('/*', requireAuth());

feedsApi.get('/', async c => {
  const database = createDatabaseClient(c.env.DB);
  const feeds = await database.select().from(feedsTable);
  return c.json(feeds);
});

feedsApi.post('/', async c => {
  const database = createDatabaseClient(c.env.DB);
  const body: unknown = await c.req.json();
  const parsed = createFeedSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid data' }, 400);
  }

  const newFeed = {
    id: v7(),
    ...parsed.data,
  };

  await database.insert(feedsTable).values(newFeed);

  return c.json(newFeed, 201);
});

feedsApi.put('/:id', async c => {
  const database = createDatabaseClient(c.env.DB);
  const id = c.req.param('id');
  const body: unknown = await c.req.json();
  const parsed = createFeedSchema.partial().safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid data' }, 400);
  }

  await database.update(feedsTable).set(parsed.data).where(eq(feedsTable.id, id));

  const updatedFeed = await database.select().from(feedsTable).where(eq(feedsTable.id, id)).get();

  if (!updatedFeed) {
    return c.json({ error: 'Feed not found' }, 404);
  }

  return c.json(updatedFeed);
});

feedsApi.delete('/:id', async c => {
  const database = createDatabaseClient(c.env.DB);
  const id = c.req.param('id');

  await database.delete(feedsTable).where(eq(feedsTable.id, id));

  return c.body(null, 204);
});
