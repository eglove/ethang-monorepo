import { makeStore, type Store } from "@ethang/store/store.ts";

export type BlogState = {
  paginationPage: number;
};

const initialState: BlogState = {
  paginationPage: 1
};

const decrementPage = (store: Store<BlogState>) => {
  return store.update((draft) => {
    draft.paginationPage -= 1;
  });
};

const incrementPage = (store: Store<BlogState>) => {
  return store.update((draft) => {
    draft.paginationPage += 1;
  });
};

const setPage = (store: Store<BlogState>, page: number) => {
  return store.update((draft) => {
    draft.paginationPage = page;
  });
};

export const blogStore: Store<BlogState> = makeStore(initialState);

export const blogStoreActions = {
  decrementPage: () => {
    return decrementPage(blogStore);
  },
  incrementPage: () => {
    return incrementPage(blogStore);
  },
  setPage: (page: number) => {
    return setPage(blogStore, page);
  }
};
