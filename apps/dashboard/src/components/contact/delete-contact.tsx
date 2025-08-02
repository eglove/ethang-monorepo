import { useMutation } from "@apollo/client";
import { Button } from "@heroui/react";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { deleteContact } from "../../graphql/mutations/delete-contact.ts";
import {
  type FetchedContact,
  getAllContacts,
} from "../../graphql/queries/get-all-contacts.ts";
import { contactStore } from "../../stores/contact-store.ts";

type DeleteContactProperties = {
  contact: FetchedContact;
};

export const DeleteContact = ({
  contact,
}: Readonly<DeleteContactProperties>) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const [handleDelete, { loading }] = useMutation(deleteContact);

  return (
    <div className="flex items-center gap-2">
      {!isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              contactStore.setContactToUpdate(contact);
              contactStore.setIsUpdateModalOpen(true);
            }}
            aria-label="Update Contact"
            color="primary"
            size="sm"
          >
            <PencilIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              setIsDeleting(true);
            }}
            aria-label="Delete"
            color="danger"
            isLoading={loading}
            size="sm"
          >
            <Trash2Icon />
          </Button>
        </>
      )}
      {isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              handleDelete({
                onCompleted: () => {
                  setIsDeleting(false);
                },
                refetchQueries: [getAllContacts],
                variables: { input: { id: contact.id } },
              }).catch(globalThis.console.error);
            }}
            aria-label="Confirm delete"
            color="danger"
            isLoading={loading}
            size="sm"
          >
            <CheckIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              setIsDeleting(false);
            }}
            aria-label="Cancel delete"
            isLoading={loading}
            size="sm"
          >
            <XIcon />
          </Button>
        </>
      )}
    </div>
  );
};
