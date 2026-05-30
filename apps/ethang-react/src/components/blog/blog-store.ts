import { BaseStore } from "@ethang/store";

const initialState = {
  paginationPage: 1
};

class BlogStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  public decrementPage = () => {
    this.update((draft) => {
      draft.paginationPage -= 1;
    });
  };

  public incrementPage = () => {
    this.update((draft) => {
      draft.paginationPage += 1;
    });
  };

  public setPage = (page: number) => {
    this.update((draft) => {
      draft.paginationPage = page;
    });
  };
}

export const blogStore = new BlogStore();
