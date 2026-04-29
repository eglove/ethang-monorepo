import { BaseStore } from '@ethang/store';

type FeedState = {
  feeds: Record<string, { description: null | string; icon: null | string; id: string; name: string; url: string; }>;
};

export class FeedStore extends BaseStore<FeedState> {
  public constructor() {
    super({ feeds: {} });
  }

  public addFeed(feed: { description?: null | string; icon?: null | string; id: string; name: string; url: string; }) {
    this.update(draft => {
      draft.feeds[feed.id] = {
        description: feed.description ?? null,
        icon: feed.icon ?? null,
        id: feed.id,
        name: feed.name,
        url: feed.url,
      };
    });
  }

  public getFeed(id: string) {
    return this.state.feeds[id];
  }

  public removeFeed(id: string) {
    this.update(draft => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete draft.feeds[id];
    });
  }
}
