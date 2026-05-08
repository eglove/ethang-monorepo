import isArray from 'lodash/isArray.js';
import { describe, expect, it, vi } from 'vitest';

import { subscriptionsApi } from './subscriptions.js';

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
const FEED_ID_123 = 'feed-123';

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
        feedId: FEED_ID_123,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const response = await subscriptionsApi.fetch(request, environment);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.feedId).toBe(FEED_ID_123);
    expect(body.userId).toBe('test-user-id');
    expect(body.category).toBe('Tech');
  });

  it('should update a subscription category', async () => {
    mockDatabase.get.mockResolvedValueOnce({ category: 'News', feedId: FEED_ID_123, userId: 'test-user-id' });
    const updateRequest = new Request(`${LOCALHOST_ROOT}${FEED_ID_123}`, {
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
    const deleteRequest = new Request(`${LOCALHOST_ROOT}${FEED_ID_123}`, {
      method: 'DELETE',
    });
    const deleteResponse = await subscriptionsApi.fetch(deleteRequest, environment);
    expect(deleteResponse.status).toBe(204);
  });
});
