import { describe, expect, it } from 'vitest';

import { SubscriptionStore } from './subscription-store.js';

describe('SubscriptionStore', () => {
  it('should initialize with empty subscriptions', () => {
    const store = new SubscriptionStore();
    expect(store.state.subscriptions).toEqual({});
  });

  it('should add a subscription', () => {
    const store = new SubscriptionStore();
    store.addSubscription('user1', 'feed1', 'Tech');

    expect(store.state.subscriptions['user1-feed1']).toEqual({
      category: 'Tech',
      feedId: 'feed1',
      userId: 'user1',
    });
  });

  it('should remove a subscription', () => {
    const store = new SubscriptionStore();
    store.addSubscription('user1', 'feed1');
    store.removeSubscription('user1', 'feed1');

    expect(store.state.subscriptions['user1-feed1']).toBeUndefined();
  });

  it('should update a subscription category', () => {
    const store = new SubscriptionStore();
    store.addSubscription('user1', 'feed1', 'Tech');
    store.updateCategory('user1', 'feed1', 'News');

    expect(store.state.subscriptions['user1-feed1'].category).toBe('News');
  });
});
