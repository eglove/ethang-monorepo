import { describe, expect, it, vi } from 'vitest';

import { articleInteractionsApi } from './article-interactions.js';

const mockDatabase = {
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

const environment = { DB: {} as Partial<D1Database> };
const LOCALHOST_ARTICLE_ID = 'http://localhost/article-123';
const ARTICLE_ID_123 = 'article-123';

describe('Article Interactions API', () => {
  it('should create a new interaction if it does not exist', async () => {
    mockDatabase.get.mockResolvedValueOnce();
    mockDatabase.values.mockResolvedValueOnce();

    const request = new Request(LOCALHOST_ARTICLE_ID, {
      body: JSON.stringify({
        isRead: true,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const response = await articleInteractionsApi.fetch(request, environment);
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.isRead).toBe(true);
    expect(body.isSaved).toBe(false);
  });

  it('should update an existing interaction', async () => {
    mockDatabase.get.mockResolvedValueOnce({ articleId: ARTICLE_ID_123, isRead: false, isSaved: false, userId: 'test-user-id' });
    mockDatabase.set.mockReturnThis();

    const request = new Request(LOCALHOST_ARTICLE_ID, {
      body: JSON.stringify({
        isSaved: true,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const response = await articleInteractionsApi.fetch(request, environment);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.isRead).toBe(false);
    expect(body.isSaved).toBe(true);
  });
});
