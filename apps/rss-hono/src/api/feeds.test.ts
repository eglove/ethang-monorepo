import isArray from 'lodash/isArray.js';
import { describe, expect, it, vi } from 'vitest';

import { feedsApi } from './feeds.js';

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

const environment = { DB: {} as D1Database };

const TEST_FEED_NAME = 'Test Feed';
const TEST_FEED_URL = 'https://test.com/rss';
const UPDATED_FEED_NAME = 'Updated Name';
const UPDATED_FEED_URL = 'https://update.com/rss';
const LOCALHOST_ROOT = 'http://localhost/';
const LOCALHOST_ID = 'http://localhost/1';

describe('Feeds API', () => {
  it('should list feeds', async () => {
    mockDatabase.from.mockResolvedValueOnce([{ id: '1', name: TEST_FEED_NAME }]);
    const response = await feedsApi.fetch(new Request(LOCALHOST_ROOT), environment);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(isArray(body)).toBe(true);
  });

  it('should create a new feed', async () => {
    mockDatabase.values.mockResolvedValueOnce();
    const request = new Request(LOCALHOST_ROOT, {
      body: JSON.stringify({
        name: TEST_FEED_NAME,
        url: TEST_FEED_URL,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const response = await feedsApi.fetch(request, environment);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.name).toBe(TEST_FEED_NAME);
    expect(body.id).toBeDefined();
  });

  it('should update a feed', async () => {
    mockDatabase.get.mockResolvedValueOnce({ id: '1', name: UPDATED_FEED_NAME, url: UPDATED_FEED_URL });
    const updateRequest = new Request(LOCALHOST_ID, {
      body: JSON.stringify({
        name: UPDATED_FEED_NAME,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
    const updateResponse = await feedsApi.fetch(updateRequest, environment);
    expect(updateResponse.status).toBe(200);
    const updatedBody = await updateResponse.json();
    expect(updatedBody.name).toBe(UPDATED_FEED_NAME);
    expect(updatedBody.url).toBe(UPDATED_FEED_URL);
  });

  it('should delete a feed', async () => {
    mockDatabase.where.mockResolvedValueOnce();
    const deleteRequest = new Request(LOCALHOST_ID, {
      method: 'DELETE',
    });
    const deleteResponse = await feedsApi.fetch(deleteRequest, environment);
    expect(deleteResponse.status).toBe(204);
  });
});
