import { Hono } from 'hono';

import { articleInteractionsApi } from './api/article-interactions.js';
import { feedsApi } from './api/feeds.js';
import { subscriptionsApi } from './api/subscriptions.js';
import { runCron } from './cron.js';

export type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', c => {
  return c.text('RSS Hono Service API');
});

app.route('/feeds', feedsApi);
app.route('/subscriptions', subscriptionsApi);
app.route('/article-interactions', articleInteractionsApi);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, environment: Bindings, _context: ExecutionContext) {
    // eslint-disable-next-line no-console
    console.info('Cron triggered');
    await runCron(environment.DB);
  },
};
