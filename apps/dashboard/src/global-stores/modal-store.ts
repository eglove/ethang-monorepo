import type { Contact } from "@ethang/schemas/src/dashboard/contact-schema.ts";

import { produce } from "immer";
import forEach from "lodash/forEach";
import { useSyncExternalStoreWithSelector } from "use-sync-external-store/with-selector";

const isOpenKeys = ["createContact", "updateContact"] as const;
export type IsOpenKeys = (typeof isOpenKeys)[number];

type ModalState = {
  contactToUpdate: Contact | null;
  createContact: boolean;
  updateContact: boolean;
};

class ModalStore {
  private state: ModalState = {
    contactToUpdate: null,
    createContact: false,
    updateContact: false,
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
