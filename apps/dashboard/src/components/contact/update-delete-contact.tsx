import { useStore } from "@ethang/store/use-store";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import type { FetchedContact } from "../../queries/get-all-contacts.ts";

import { authStore } from "../../stores/auth-store.ts";
import { contactStore } from "../../stores/contact-store.ts";

type UpdateDeleteContactProperties = {
  contact: FetchedContact;
};

export const UpdateDeleteContact = ({
  contact,
}: Readonly<UpdateDeleteContactProperties>) => {
  const userId = useStore(authStore, (state) => state.userId);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isPending, mutate } = useMutation(
    contactStore.deleteContact(userId ?? undefined, () => {
      setIsDeleting(false);
    }),
  );

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
            isLoading={isPending}
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
              mutate(contact);
            }}
            aria-label="Confirm delete"
            color="danger"
            isLoading={isPending}
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
            isLoading={isPending}
            size="sm"
          >
            <XIcon />
          </Button>
        </>
      )}
    </div>
  );
};
