import { describe, expect, it } from 'vitest';

import app from './index';

describe('RSS Hono Service', () => {
  it('should return 200 OK on GET /', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-type-assertion
    const response = await app.fetch(new Request('http://localhost/')) as Response;
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('RSS Hono Service API');
  });
});
