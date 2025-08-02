import type { CreateContact } from "@ethang/schemas/dashboard/contact-schema.ts";

import { BaseStore } from "@ethang/store";
import isNil from "lodash/isNil";

import type { FetchedContact } from "../queries/get-all-contacts.ts";

const defaultState = {
  contactToUpdate: null as FetchedContact | null,
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
};

type ContactStoreState = typeof defaultState;
const contactPath = "/api/contact";

class ContactStore extends BaseStore<ContactStoreState> {
  public constructor() {
    super(defaultState);
  }

  public createContact() {
    return {
      mutationFn: async (data: CreateContact) => {
        const response = await fetch(contactPath, {
          body: JSON.stringify(data),
          method: "POST",
        });

        if (response.ok) {
          this.update((draft) => {
            draft.isCreateModalOpen = false;
          }, false);
        }
      },
    };
  }

  public deleteContact = (userId = "", onOk?: () => void) => {
    return {
      mutationFn: async (contact: FetchedContact) => {
        if (isNil(userId)) {
          return;
        }

        const response = await globalThis.fetch(contactPath, {
          body: JSON.stringify({ id: contact.id, userId }),
          method: "DELETE",
        });

        if (response.ok) {
          onOk?.();
        }
      },
    };
  };

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

  public updateContact(userId = "") {
    return {
      mutationFn: async (contact: FetchedContact) => {
        const response = await globalThis.fetch(contactPath, {
          body: JSON.stringify({
            ...contact,
            userId,
          }),
          method: "PUT",
        });

        if (response.ok) {
          this.update((draft) => {
            draft.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }
}

export const contactStore = new ContactStore();
