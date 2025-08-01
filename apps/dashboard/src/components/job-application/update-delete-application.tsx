import { useStore } from "@ethang/store/use-store";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import type { FetchedApplication } from "../../queries/get-all-applications.ts";

import { applicationStore } from "../../stores/application-store.ts";
import { authStore } from "../../stores/auth-store.ts";

export const UpdateDeleteApplication = ({
  application,
}: Readonly<{ application: FetchedApplication }>) => {
  const userId = useStore(authStore, (state) => state.userId);
  const [isDeleting, setIsDeleting] = useState(false);

  const { isPending, mutate } = useMutation(
    applicationStore.deleteApplication(userId ?? undefined, () => {
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
