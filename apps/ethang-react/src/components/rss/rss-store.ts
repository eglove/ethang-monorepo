import { makeStore, type Store } from "@ethang/store/store.ts";

export type PendingUnsubscribe = {
  feedId: string;
  title: string;
};

export type RssState = {
  pendingUnsubscribe: null | PendingUnsubscribe;
  selectedFeedId: null | string;
};

const initialState: RssState = {
  pendingUnsubscribe: null,
  selectedFeedId: null
};

const cancelUnsubscribe = (store: Store<RssState>) => {
  return store.update((draft) => {
    draft.pendingUnsubscribe = null;
  });
};

const requestUnsubscribe = (
  store: Store<RssState>,
  feedId: string,
  title: string
) => {
  return store.update((draft) => {
    draft.pendingUnsubscribe = { feedId, title };
  });
};

const setSelectedFeedId = (
  store: Store<RssState>,
  selectedFeedId: null | string
) => {
  return store.update((draft) => {
    draft.selectedFeedId = selectedFeedId;
  });
};

export const rssStore: Store<RssState> = makeStore(initialState);

export const rssStoreActions = {
  cancelUnsubscribe: () => {
    return cancelUnsubscribe(rssStore);
  },
  requestUnsubscribe: (feedId: string, title: string) => {
    return requestUnsubscribe(rssStore, feedId, title);
  },
  setSelectedFeedId: (selectedFeedId: null | string) => {
    return setSelectedFeedId(rssStore, selectedFeedId);
  }
};
