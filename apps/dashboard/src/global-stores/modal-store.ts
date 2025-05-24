import type { Bookmark } from "@ethang/schemas/src/dashboard/bookmark.ts";

import { produce } from "immer";
import forEach from "lodash/forEach";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

const isOpenKeys = ["createBookmark", "updateBookmark"] as const;
type IsOpenKeys = (typeof isOpenKeys)[number];

type ModalState = {
  bookmarkToUpdate: Bookmark | undefined;
  createBookmark: boolean;
  updateBookmark: boolean;
};

class ModalStore {
  private state: ModalState = {
    bookmarkToUpdate: undefined,
    createBookmark: false,
    updateBookmark: false,
  };
  private readonly subscribers = new Set<(state: ModalState) => void>();

  public closeModal(key: IsOpenKeys) {
    this.setIsModalOpen(key, false);
  }

  public get() {
    return this.state;
  }

  public openModal(key: IsOpenKeys) {
    this.setIsModalOpen(key, true);
  }

  public setBookmarkToUpdate(bookmark: Bookmark) {
    this.update(
      produce(this.state, (draft) => {
        draft.bookmarkToUpdate = bookmark;
      }),
    );
  }

  public setIsModalOpen(key: IsOpenKeys, value: boolean) {
    if (this.state[key] === value) {
      return;
    }

    this.closeAllModals();
    this.update(
      produce(this.state, (draft) => {
        draft[key] = value;
      }),
    );
  }

  public subscribe(callback: (state: ModalState) => void) {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  public update(newState: ModalState, shouldNotify = true) {
    this.state = newState;

    if (shouldNotify) {
      this.notifySubscribers();
    }
  }

  private closeAllModals() {
    this.update(
      produce(this.state, (draft) => {
        forEach(isOpenKeys, (key) => {
          draft[key] = false;
        });
      }),
      false,
    );
  }

  private notifySubscribers() {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }
}

export const modalStore = new ModalStore();

export const useModalStore = <Selection>(
  selector: (snapshot: ModalState) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
) => {
  return useSyncExternalStoreWithSelector(
    (listener) => {
      return modalStore.subscribe(listener);
    },
    () => modalStore.get(),
    () => modalStore.get(),
    selector,
    isEqual,
  );
};
