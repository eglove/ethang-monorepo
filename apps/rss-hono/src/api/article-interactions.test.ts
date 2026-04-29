import { describe, expect, it, vi } from 'vitest';

import { articleInteractionsApi } from './article-interactions.js';

vi.mock('@ethang/hono-middleware', () => {
  return {
    requireAuth: () => {return async (c: { set: (k: string, v: unknown) => void }, next: () => Promise<void>) => {
      c.set('user', { id: 'test-user-id' });
      await next();
    }},
  };
});

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

const environment = { DB: {} as unknown as D1Database };

describe('Article Interactions API', () => {
  it('should create a new interaction if it does not exist', async () => {
    mockDatabase.get.mockResolvedValueOnce();
    mockDatabase.values.mockResolvedValueOnce();

    const request = new Request('http://localhost/article-123', {
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
    mockDatabase.get.mockResolvedValueOnce({ articleId: 'article-123', isRead: false, isSaved: false, userId: 'test-user-id' });
    mockDatabase.set.mockReturnThis();

    const request = new Request('http://localhost/article-123', {
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
