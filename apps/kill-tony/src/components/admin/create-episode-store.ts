import type z from "zod";

import { BaseStore } from "@ethang/store";

import type { appearancesSchema } from "../../../schemas/appearance-schema.ts";

const initialState = {
  formState: {
    appearances: [] as z.output<typeof appearancesSchema>,
    number: 0,
    publishDate: "",
    title: "",
    url: "",
  },
  isAppearanceModalOpen: false,
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

  public toggleAppearanceModal(value: boolean) {
    this.update((draft) => {
      draft.isAppearanceModalOpen = value;
    });
  }
}

export const createEpisodeStore = new CreateEpisodeStore();
