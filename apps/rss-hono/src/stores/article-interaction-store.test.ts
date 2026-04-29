import { describe, expect, it } from 'vitest';

import { ArticleInteractionStore } from './article-interaction-store.js';

describe('ArticleInteractionStore', () => {
  it('should initialize with empty interactions', () => {
    const store = new ArticleInteractionStore();
    expect(store.state.interactions).toEqual({});
  });

  it('should set an interaction', () => {
    const store = new ArticleInteractionStore();
    store.setInteraction('user1', 'article1', true, false);

    expect(store.state.interactions['user1-article1']).toEqual({
      articleId: 'article1',
      isRead: true,
      isSaved: false,
      userId: 'user1',
    });
  });

  it('should mark as read', () => {
    const store = new ArticleInteractionStore();
    store.markAsRead('user1', 'article1');
    expect(store.state.interactions['user1-article1'].isRead).toBe(true);
  });

  it('should mark as unread', () => {
    const store = new ArticleInteractionStore();
    store.markAsRead('user1', 'article1');
    store.markAsUnread('user1', 'article1');
    expect(store.state.interactions['user1-article1'].isRead).toBe(false);
  });

  it('should toggle saved', () => {
    const store = new ArticleInteractionStore();
    store.toggleSaved('user1', 'article1');
    expect(store.state.interactions['user1-article1'].isSaved).toBe(true);

    store.toggleSaved('user1', 'article1');
    expect(store.state.interactions['user1-article1'].isSaved).toBe(false);
  });
});
