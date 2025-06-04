import type { JobApplication } from "@ethang/schemas/src/dashboard/application-schema.ts";

import { useUser } from "@clerk/clerk-react";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { applicationStore } from "../../data/application-store.ts";

export const UpdateDeleteApplication = ({
  application,
}: Readonly<{ application: JobApplication }>) => {
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const { isPending, mutate } = useMutation(
    applicationStore.deleteApplication(user?.id, () => {
      setIsDeleting(false);
    }),
  );

  return (
    <div className="flex gap-2 items-center">
      {!isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              applicationStore.setApplicationToUpdate(application);
              applicationStore.setIsUpdateModalOpen(true);
            }}
            aria-label="Update Application"
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
              mutate(application);
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
