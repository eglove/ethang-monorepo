import { describe, expect, it, vi } from 'vitest';

import { feedsApi } from './feeds.js';

// Mock the auth middleware to always pass for these tests
vi.mock('@ethang/hono-middleware', () => {
  return {
    requireAuth: () => {return async (c: any, next: any) => {
      c.set('user', { id: 'test-user' });
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
    createDatabaseClient: () => {return mockDatabase},
  };
});

const environment = { DB: {} as D1Database };

describe('Feeds API', () => {
  it('should list feeds', async () => {
    mockDatabase.from.mockResolvedValueOnce([{ id: '1', name: 'Test Feed' }]);
    const res = await feedsApi.fetch(new Request('http://localhost/'), environment);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  it('should create a new feed', async () => {
    mockDatabase.values.mockResolvedValueOnce();
    const request = new Request('http://localhost/', {
      body: JSON.stringify({
        name: 'Test Feed',
        url: 'https://test.com/rss',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    const res = await feedsApi.fetch(request, environment);
    expect(res.status).toBe(201);
    const body = await res.json() as any;
    expect(body.name).toBe('Test Feed');
    expect(body.id).toBeDefined();
  });

  it('should update a feed', async () => {
    mockDatabase.get.mockResolvedValueOnce({ id: '1', name: 'Updated Name', url: 'https://update.com/rss' });
    const updateRequest = new Request('http://localhost/1', {
      body: JSON.stringify({
        name: 'Updated Name',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PUT',
    });
    const updateRes = await feedsApi.fetch(updateRequest, environment);
    expect(updateRes.status).toBe(200);
    const updatedBody = await updateRes.json() as any;
    expect(updatedBody.name).toBe('Updated Name');
    expect(updatedBody.url).toBe('https://update.com/rss');
  });

  it('should delete a feed', async () => {
    mockDatabase.where.mockResolvedValueOnce();
    const deleteRequest = new Request('http://localhost/1', {
      method: 'DELETE',
    });
    const deleteRes = await feedsApi.fetch(deleteRequest, environment);
    expect(deleteRes.status).toBe(204);
  });
});
