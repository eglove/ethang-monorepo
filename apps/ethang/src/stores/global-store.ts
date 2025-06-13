import { BaseStore } from "@ethang/store";

const initialState = {
  isNavMenuOpen: false,
};

type GlobalStoreState = typeof initialState;

export class GlobalStore extends BaseStore<GlobalStoreState> {
  public constructor() {
    super(initialState);
  }

  public setIsNavMenuOpen(value: boolean) {
    this.update((draft) => {
      draft.isNavMenuOpen = value;
    });
  }
}

export const globalStore = new GlobalStore();
