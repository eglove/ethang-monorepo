import isArray from 'lodash/isArray.js';
import { describe, expect, it, vi } from 'vitest';

import { subscriptionsApi } from './subscriptions.js';

vi.mock('@ethang/hono-middleware', () => {
  return {
    requireAuth: () => {return async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
      c.set('user', { id: 'test-user-id' });
      await next();
    }},
  };
});

const mockDatabase = {
  delete: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  get: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
};

vi.mock('../db/client.js', () => {
  return {
    createDatabaseClient: () => {
      return mockDatabase;
    },
  };
});

const environment = { DB: {} as unknown as D1Database };

const LOCALHOST_ROOT = 'http://localhost/';

describe('Subscriptions API', () => {
  it('should list user subscriptions', async () => {
    mockDatabase.where.mockResolvedValueOnce([{ category: null, feedId: '1', userId: 'test-user-id' }]);
    const response = await subscriptionsApi.fetch(new Request(LOCALHOST_ROOT), environment);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(isArray(body)).toBe(true);
  });

  it('should subscribe to a feed', async () => {
    mockDatabase.values.mockResolvedValueOnce();
    const request = new Request(LOCALHOST_ROOT, {
      body: JSON.stringify({
        category: 'Tech',
        feedId: 'feed-123',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const response = await subscriptionsApi.fetch(request, environment);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.feedId).toBe('feed-123');
    expect(body.userId).toBe('test-user-id');
    expect(body.category).toBe('Tech');
  });

  it('should update a subscription category', async () => {
    mockDatabase.get.mockResolvedValueOnce({ category: 'News', feedId: 'feed-123', userId: 'test-user-id' });
    const updateRequest = new Request('http://localhost/feed-123', {
      body: JSON.stringify({
        category: 'News',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
    const updateResponse = await subscriptionsApi.fetch(updateRequest, environment);
    expect(updateResponse.status).toBe(200);
    const updatedBody = await updateResponse.json();
    expect(updatedBody.category).toBe('News');
  });

  it('should unsubscribe from a feed', async () => {
    mockDatabase.where.mockResolvedValueOnce();
    const deleteRequest = new Request('http://localhost/feed-123', {
      method: 'DELETE',
    });
    const deleteResponse = await subscriptionsApi.fetch(deleteRequest, environment);
    expect(deleteResponse.status).toBe(204);
  });
});
