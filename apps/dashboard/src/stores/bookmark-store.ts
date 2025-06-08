import {
  type Bookmark,
  bookmarksSchema,
} from "@ethang/schemas/src/dashboard/bookmark-schema.ts";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty.js";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";

import { queryClient } from "../components/providers.tsx";
import { queryKeys } from "../data/queries/queries.ts";
import { BaseStore, useStore } from "./base-store.ts";

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

        await queryClient.invalidateQueries({
          queryKey: queryKeys.bookmarks(userId),
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
          await queryClient.invalidateQueries({
            queryKey: queryKeys.bookmarks(userId),
          });

          onOk?.();
        }
      },
    };
  }

  public getAll(userId = "") {
    return queryOptions({
      enabled: !isNil(userId) && !isEmpty(userId),
      queryFn: async () => {
        const data = await fetchJson(bookmarkPath, bookmarksSchema);

        if (isError(data)) {
          throw data;
        }

        return data;
      },
      queryKey: queryKeys.bookmarks(userId),
    });
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
          await queryClient.invalidateQueries({
            queryKey: queryKeys.bookmarks(userId),
          });

          this.update((state) => {
            state.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }
}

export const bookmarkStore = new BookmarkStore();

export const useBookmarkStore = <Selection>(
  selector: (snapshot: BookmarkStore["state"]) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
) => {
  return useStore(bookmarkStore, selector, isEqual);
};
