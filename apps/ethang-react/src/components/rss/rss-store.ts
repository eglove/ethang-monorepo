import { BaseStore } from "@ethang/store";

const initialState = {
  selectedFeedId: null as null | string
};

class RssStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  public setSelectedFeedId(selectedFeedId: null | string) {
    this.update((draft) => {
      draft.selectedFeedId = selectedFeedId;
    });
  }
}

export const rssStore = new RssStore();
