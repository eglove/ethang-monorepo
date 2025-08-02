import type { Bookmark } from "@ethang/schemas/dashboard/bookmark-schema.ts";

import { BaseStore } from "@ethang/store";

const defaultState = {
  bookmarkToUpdate: null as Bookmark | null,
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
};

type BookmarkStoreState = typeof defaultState;

export class BookmarkStore extends BaseStore<BookmarkStoreState> {
  public constructor() {
    super(defaultState);
  }

  public setBookmarkToUpdate(bookmark: Bookmark | null) {
    this.update((state) => {
      state.bookmarkToUpdate = bookmark;
    });
  }

  public setIsCreateModalOpen(isOpen: boolean) {
    this.update((draft) => {
      draft.isCreateModalOpen = isOpen;
    });
  }

  public setIsUpdateModalOpen(isOpen: boolean) {
    this.update((draft) => {
      draft.isUpdateModalOpen = isOpen;
    });
  }
}

export const bookmarkStore = new BookmarkStore();
