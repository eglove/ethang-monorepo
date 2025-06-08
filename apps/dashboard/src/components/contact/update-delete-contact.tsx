import type { Contact } from "@ethang/schemas/src/dashboard/contact-schema.ts";

import { useUser } from "@clerk/clerk-react";
import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore } from "../../stores/modal-store.ts";

type UpdateDeleteContactProperties = {
  contact: Contact;
};

export const UpdateDeleteContact = ({
  contact,
}: Readonly<UpdateDeleteContactProperties>) => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      if (isNil(user?.id)) {
        return;
      }

      const response = await globalThis.fetch("/api/contact", {
        body: JSON.stringify({ id: contact.id, userId: user.id }),
        method: "DELETE",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allContacts(user.id),
        });
        setIsDeleting(false);
      }
    },
  });

  return (
    <div className="flex gap-2 items-center">
      {!isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              modalStore.setContactToUpdate(contact);
              modalStore.openModal("updateContact");
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
              mutate();
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
