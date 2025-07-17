import { BaseStore } from "@ethang/store";

const initialState = {
  formState: {
    number: 0,
    publishDate: "",
    title: "",
    url: "",
  },
};

export class CreateEpisodeStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
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

export const createEpisodeStore = new CreateEpisodeStore();
