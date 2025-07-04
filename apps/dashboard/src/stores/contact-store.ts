import {
  type Contact,
  contactsSchema,
  type CreateContact,
} from "@ethang/schemas/dashboard/contact-schema.ts";
import { BaseStore } from "@ethang/store";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { queryOptions } from "@tanstack/react-query";
import isEmpty from "lodash/isEmpty";
import isError from "lodash/isError";
import isNil from "lodash/isNil";

import { queryClient } from "../components/providers.tsx";
import { queryKeys } from "../data/queries/queries.ts";
import { authStore } from "./auth-store.ts";

const defaultState = {
  contactToUpdate: null as Contact | null,
  isCreateModalOpen: false,
  isUpdateModalOpen: false,
};

type ContactStoreState = typeof defaultState;
const contactPath = "/api/contact";

class ContactStore extends BaseStore<ContactStoreState> {
  public constructor() {
    super(defaultState);
  }

  public createContact(userId = "") {
    return {
      mutationFn: async (data: CreateContact) => {
        const response = await fetch(contactPath, {
          body: JSON.stringify(data),
          method: "POST",
        });

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allContacts(userId),
          });

          this.update((draft) => {
            draft.isCreateModalOpen = false;
          }, false);
        }
      },
    };
  }

  public deleteContact = (userId = "", onOk?: () => void) => {
    return {
      mutationFn: async (contact: Contact) => {
        if (isNil(userId)) {
          return;
        }

        const response = await globalThis.fetch(contactPath, {
          body: JSON.stringify({ id: contact.id, userId }),
          method: "DELETE",
        });

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allContacts(userId),
          });
          onOk?.();
        }
      },
    };
  };

  public getAll(userId = "") {
    return queryOptions({
      enabled: !isEmpty(userId),
      queryFn: async () => {
        if (isEmpty(userId)) {
          throw new Error("No user found");
        }

        const response = await fetch(contactPath);

        if (401 === response.status) {
          authStore.signOut();
          throw new Error("Unauthorized");
        }

        const data = await parseFetchJson(response, contactsSchema);

        if (isError(data)) {
          throw new Error("Failed to fetch contacts");
        }

        return data;
      },
      queryKey: queryKeys.contacts(userId),
    });
  }

  public setContactToUpdate = (contact: Contact | null) => {
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
      mutationFn: async (contact: Contact) => {
        const response = await globalThis.fetch(contactPath, {
          body: JSON.stringify({
            ...contact,
            userId,
          }),
          method: "PUT",
        });

        if (response.ok) {
          await queryClient.invalidateQueries({
            queryKey: queryKeys.allContacts(userId),
          });

          this.update((draft) => {
            draft.isUpdateModalOpen = false;
          }, false);
        }
      },
    };
  }
}

export const contactStore = new ContactStore();
