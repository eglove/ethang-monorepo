import { describe, expect, it } from 'vitest';

import app from './index';

describe('RSS Hono Service', () => {
  it('should return 200 OK on GET /', async () => {
    const response = await app.fetch(new Request('http://localhost/'));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('RSS Hono Service API');
  });
});
