import { BaseStore } from "@ethang/store";

import type { FetchedContact } from "../graphql/queries/get-all-contacts.ts";

const defaultState = {
  contactToUpdate: null as FetchedContact | null,
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
};

type ContactStoreState = typeof defaultState;

class ContactStore extends BaseStore<ContactStoreState> {
  public constructor() {
    super(defaultState);
  }

  public setContactToUpdate = (contact: FetchedContact | null) => {
    this.update((draft) => {
      draft.contactToUpdate = contact;
    });
  };

  public setIsCreateModalOpen = (isOpen: boolean) => {
    this.update((draft) => {
      draft.isCreateModalOpen = isOpen;
    });
  };

  public setIsUpdateModalOpen = (isOpen: boolean) => {
    this.update((draft) => {
      draft.isUpdateModalOpen = isOpen;
    });
  };
}

export const contactStore = new ContactStore();
