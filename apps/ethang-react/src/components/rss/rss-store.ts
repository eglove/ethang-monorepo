import { BaseStore } from "@ethang/store";

const initialState = {
  pendingUnsubscribe: null as {
    feedId: string;
    title: string;
  } | null,
  selectedFeedId: null as null | string
};

class RssStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  public cancelUnsubscribe() {
    this.update((draft) => {
      draft.pendingUnsubscribe = null;
    });
  }

  public requestUnsubscribe(feedId: string, title: string) {
    this.update((draft) => {
      draft.pendingUnsubscribe = { feedId, title };
    });
  }

  public setSelectedFeedId(selectedFeedId: null | string) {
    this.update((draft) => {
      draft.selectedFeedId = selectedFeedId;
    });
  }
}

export const rssStore = new RssStore();
