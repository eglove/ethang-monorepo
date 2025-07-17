import { BaseStore } from "@ethang/store";

const initialState = {
  formState: {
    isBucketPull: false,
    isGoldenTicketWinner: false,
    isGuest: false,
    isHallOfFame: false,
    isRegular: false,
    name: "",
  },
};

export class CreateAppearanceStore extends BaseStore<typeof initialState> {
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

export const createAppearanceStore = new CreateAppearanceStore();
