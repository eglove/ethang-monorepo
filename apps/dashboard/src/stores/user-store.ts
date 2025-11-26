import { BaseStore } from "@ethang/store";

const defaultUserStoreState = {
  currentTab: "videos",
};

class UserStore extends BaseStore<typeof defaultUserStoreState> {
  public constructor() {
    super(defaultUserStoreState);
  }

  public setCurrentTab(tab: string) {
    this.update((draft) => {
      draft.currentTab = tab;
    });
  }
}

export const userStore = new UserStore();
