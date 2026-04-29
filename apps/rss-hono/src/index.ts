import { Hono } from 'hono';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.text('RSS Hono Service API');
});

export default {
  fetch: app.fetch,
  scheduled(event: ScheduledEvent, _environment: Bindings, _context: ExecutionContext) {
    // eslint-disable-next-line no-console
    console.info('Cron triggered:', event.cron);
  },
};
