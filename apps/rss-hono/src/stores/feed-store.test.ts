import { describe, expect, it } from 'vitest';

import { FeedStore } from './feed-store.js';

describe('FeedStore', () => {
  it('should initialize with empty feeds', () => {
    const store = new FeedStore();
    expect(store.state.feeds).toEqual({});
  });

  const BLOG_NAME = 'Ethang Blog';
  const BLOG_URL = 'https://ethang.dev/rss.xml';

  it('should add a feed', () => {
    const store = new FeedStore();
    store.addFeed({
      id: '1',
      name: BLOG_NAME,
      url: BLOG_URL,
    });

    expect(store.state.feeds['1']).toEqual({
      description: null,
      icon: null,
      id: '1',
      name: BLOG_NAME,
      url: BLOG_URL,
    });
  });

  it('should remove a feed', () => {
    const store = new FeedStore();
    store.addFeed({
      id: '1',
      name: BLOG_NAME,
      url: BLOG_URL,
    });

    store.removeFeed('1');
    expect(store.state.feeds['1']).toBeUndefined();
  });

  it('should get a feed by id', () => {
    const store = new FeedStore();
    store.addFeed({
      id: '1',
      name: BLOG_NAME,
      url: BLOG_URL,
    });

    const feed = store.getFeed('1');
    expect(feed.name).toBe(BLOG_NAME);
  });
});
