import type { UpdateJobApplication } from "@ethang/schemas/src/dashboard/application-schema.ts";
import type { Bookmark } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";
import type { Contact } from "@ethang/schemas/src/dashboard/contact-schema.ts";
import type { QuestionAnswer } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";
import type { Todo } from "@ethang/schemas/src/dashboard/todo-schema.ts";

import { produce } from "immer";
import forEach from "lodash/forEach";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

const isOpenKeys = [
  "createBookmark",
  "updateBookmark",
  "updateApplication",
  "createJobApplication",
  "createQa",
  "updateQa",
  "createTodo",
  "updateTodo",
  "createContact",
  "updateContact",
] as const;
export type IsOpenKeys = (typeof isOpenKeys)[number];

type ModalState = {
  applicationToUpdate: null | UpdateJobApplication;
  bookmarkToUpdate: Bookmark | null;
  contactToUpdate: Contact | null;
  createBookmark: boolean;
  createContact: boolean;
  createJobApplication: boolean;
  createQa: boolean;
  createTodo: boolean;
  qaToUpdate: null | QuestionAnswer;
  todoToUpdate: null | Todo;
  updateApplication: boolean;
  updateBookmark: boolean;
  updateContact: boolean;
  updateQa: boolean;
  updateTodo: boolean;
};

class ModalStore {
  private state: ModalState = {
    applicationToUpdate: null,
    bookmarkToUpdate: null,
    contactToUpdate: null,
    createBookmark: false,
    createContact: false,
    createJobApplication: false,
    createQa: false,
    createTodo: false,
    qaToUpdate: null,
    todoToUpdate: null,
    updateApplication: false,
    updateBookmark: false,
    updateContact: false,
    updateQa: false,
    updateTodo: false,
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

  public setApplicationToUpdate(application: null | UpdateJobApplication) {
    this.update((draft) => {
      draft.applicationToUpdate = application;
    });
  }

  public setBookmarkToUpdate(bookmark: Bookmark | null) {
    this.update((draft) => {
      draft.bookmarkToUpdate = bookmark;
    });
  }

  public setContactToUpdate(contact: Contact | null) {
    this.update((draft) => {
      draft.contactToUpdate = contact;
    });
  }

  public setIsModalOpen(key: IsOpenKeys, value: boolean) {
    if (this.state[key] === value) {
      return;
    }

    this.closeAllModals();
    this.update((draft) => {
      draft[key] = value;
    });
  }

  public setQaToUpdate(qa: null | QuestionAnswer) {
    this.update((draft) => {
      draft.qaToUpdate = qa;
    });
  }

  public setTodoToUpdate(todo: null | Todo) {
    this.update((draft) => {
      draft.todoToUpdate = todo;
    });
  }

  public subscribe(callback: (state: ModalState) => void) {
    this.subscribers.add(callback);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  public update(updater: (draft: ModalState) => void, shouldNotify = true) {
    this.state = produce(this.state, updater);

    if (shouldNotify) {
      this.notifySubscribers();
    }
  }

  private closeAllModals() {
    this.update((draft) => {
      forEach(isOpenKeys, (key) => {
        draft[key] = false;
      });
    }, false);
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
