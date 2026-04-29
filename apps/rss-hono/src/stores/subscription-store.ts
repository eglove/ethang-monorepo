import { BaseStore } from '@ethang/store';
import isNil from 'lodash/isNil.js';

type SubscriptionState = {
  subscriptions: Record<string, { category: null | string; feedId: string; userId: string; }>;
};

export class SubscriptionStore extends BaseStore<SubscriptionState> {
  public constructor() {
    super({ subscriptions: {} });
  }

  public addSubscription(userId: string, feedId: string, category?: null | string) {
    const key = `${userId}-${feedId}`;
    this.update(draft => {
      draft.subscriptions[key] = {
        category: category ?? null,
        feedId,
        userId,
      };
    });
  }

  public removeSubscription(userId: string, feedId: string) {
    const key = `${userId}-${feedId}`;
    this.update(draft => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete draft.subscriptions[key];
    });
  }

  public updateCategory(userId: string, feedId: string, category: null | string) {
    const key = `${userId}-${feedId}`;
    this.update(draft => {
      const subscription = draft.subscriptions[key];
      if (!isNil(subscription)) {
        subscription.category = category;
      }
    });
  }
}
