import type { Bookmark } from "@ethang/schemas/dashboard/bookmark-schema.ts";

import { BaseStore } from "@ethang/store";

const defaultState = {
  bookmarkToUpdate: null as Bookmark | null,
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
};

type BookmarkStoreState = typeof defaultState;
const bookmarkPath = "/api/bookmark";

export class BookmarkStore extends BaseStore<BookmarkStoreState> {
  public constructor() {
    super(defaultState);
  }

  public createBookmark(userId = "") {
    return {
      mutationFn: async (data: { title: string; url: string }) => {
        await globalThis.fetch(bookmarkPath, {
          body: JSON.stringify({
            title: data.title,
            url: data.url,
            userId,
          }),
          method: "POST",
        });

        this.update((state) => {
          state.isCreateModalOpen = false;
        }, false);
      },
    };
  }

  public deleteBookmark(userId = "", onOk?: () => void) {
    return {
      mutationFn: async (bookmark: Bookmark) => {
        const response = await globalThis.fetch(bookmarkPath, {
          body: JSON.stringify({ id: bookmark.id, userId }),
          method: "DELETE",
        });

        if (response.ok) {
          onOk?.();
        }
      },
    };
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

  public updateBookmark(userId = "") {
    return {
      mutationFn: async (data: Bookmark) => {
        const response = await fetch(bookmarkPath, {
          body: JSON.stringify(data),
          method: "PUT",
        });

        if (response.ok) {
          this.update((state) => {
            state.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }
}

export const bookmarkStore = new BookmarkStore();
