import type { Context } from 'hono';

import { and, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';

import type { Bindings } from '../index.js';

import { createDatabaseClient } from '../db/client.js';
import { userSubscriptionsTable } from '../schema.js';

let requireAuth: any;

if ('test' === process.env.NODE_ENV) {
  requireAuth = () => {return async (c: Context<{
    Bindings: Bindings;
    Variables: { user: { id: string } };
  }>, next: () => Promise<void>) => {
    c.set('user', { id: 'test-user-id' });
    return next();
  }};
} else {
  // eslint-disable-next-line node/no-missing-import
  const realAuth = await import('@ethang/hono-middleware');
  requireAuth = realAuth.requireAuth;
}

export const subscriptionsApi = new Hono<{ Bindings: { DB: D1Database }; Variables: { user: { id: string } } }>();

const subscriptionSchema = z.object({
  category: z.string().optional(),
  feedId: z.string(),
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
subscriptionsApi.use('/*', requireAuth());

subscriptionsApi.get('/', async c => {
  const database = createDatabaseClient(c.env.DB);
  const user = c.get('user');

  const subscriptions = await database
    .select()
    .from(userSubscriptionsTable)
    .where(eq(userSubscriptionsTable.userId, user.id));

  return c.json(subscriptions);
});

subscriptionsApi.post('/', async c => {
  const database = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const body: unknown = await c.req.json();
  const parsed = subscriptionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid data' }, 400);
  }

  const newSubscription = {
    category: parsed.data.category ?? null,
    feedId: parsed.data.feedId,
    userId: user.id,
  };

  await database.insert(userSubscriptionsTable).values(newSubscription);

  return c.json(newSubscription, 201);
});

subscriptionsApi.put('/:feedId', async c => {
  const database = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const feedId = c.req.param('feedId');
  const body: unknown = await c.req.json();
  const parsed = z.object({ category: z.string().nullable() }).safeParse(body);

  if (!parsed.success) {
    return c.json({ error: 'Invalid data' }, 400);
  }

  await database
    .update(userSubscriptionsTable)
    .set({ category: parsed.data.category })
    .where(and(eq(userSubscriptionsTable.userId, user.id), eq(userSubscriptionsTable.feedId, feedId)));

  const updatedSubscription = await database
    .select()
    .from(userSubscriptionsTable)
    .where(and(eq(userSubscriptionsTable.userId, user.id), eq(userSubscriptionsTable.feedId, feedId)))
    .get();

  if (updatedSubscription === undefined) {
    return c.json({ error: 'Subscription not found' }, 404);
  }

  return c.json(updatedSubscription);
});

subscriptionsApi.delete('/:feedId', async c => {
  const database = createDatabaseClient(c.env.DB);
  const user = c.get('user');
  const feedId = c.req.param('feedId');

  await database
    .delete(userSubscriptionsTable)
    .where(and(eq(userSubscriptionsTable.userId, user.id), eq(userSubscriptionsTable.feedId, feedId)));

  return c.body(null, 204);
});
