import { BaseStore } from "@ethang/store";

const initialState = {
  formState: {
    isBucketPull: false,
    isGoldenTicketCashIn: false,
    isGuest: false,
    isHallOfFame: false,
    isRegular: false,
    name: "",
  },
};

export class AddAppearanceStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  public clearForm() {
    this.update((draft) => {
      draft.formState = initialState.formState;
    });
  }

  public onChange<K extends keyof typeof initialState.formState>(
    key: K,
    value: (typeof initialState.formState)[K],
  ) {
    this.update((draft) => {
      draft.formState[key] = value;
    });
  }
}

export const addAppearanceStore = new AddAppearanceStore();
