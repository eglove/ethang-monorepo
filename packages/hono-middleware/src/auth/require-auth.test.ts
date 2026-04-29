import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import { requireAuth } from './require-auth.js';

vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response());

const PROTECTED_ROUTE = '/protected';
const LOCALHOST_URL = 'http://localhost/protected';

describe('requireAuth Middleware', () => {
  it('should return 401 if no token is provided', async () => {
    const app = new Hono<{ Variables: { user: unknown } }>();
     
    app.get(PROTECTED_ROUTE, requireAuth(), c => {
      return c.text('Success');
    });

    const response = await app.fetch(new Request(LOCALHOST_URL));

    expect(response.status).toBe(401);
  });

  it('should return 401 if verification fails', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: false,
    });

    const app = new Hono<{ Variables: { user: unknown } }>();
     
    app.get(PROTECTED_ROUTE, requireAuth(), c => {
      return c.text('Success');
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set('Cookie', 'ethang-auth-token=invalid-token');

    const response = await app.fetch(request);

    expect(response.status).toBe(401);
  });

  it('should proceed if verification succeeds', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call
    (globalThis.fetch as any).mockResolvedValueOnce({
      // eslint-disable-next-line @typescript-eslint/require-await
      json: async () => {
        return { id: '123' };
      },
      ok: true,
    });

    const app = new Hono<{ Variables: { user: unknown } }>();
     
    app.get(PROTECTED_ROUTE, requireAuth(), c => {
      const user = c.get('user');
      return c.json({ user });
    });

    const request = new Request(LOCALHOST_URL);
    request.headers.set('Cookie', 'ethang-auth-token=valid-token');

    const response = await app.fetch(request);

    expect(response.status).toBe(200);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const body: { user: { id: string } } = await response.json();

    expect(body.user).toStrictEqual({ id: '123' });
  });
});
