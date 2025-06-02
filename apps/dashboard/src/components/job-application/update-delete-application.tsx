import type { JobApplication } from "@ethang/schemas/src/dashboard/application-schema.ts";

import { useUser } from "@clerk/clerk-react";
import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore } from "../../global-stores/modal-store.ts";
import { toastError } from "../../utilities/toast-error.ts";

export const UpdateDeleteApplication = ({
  application,
}: Readonly<{ application: JobApplication }>) => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      if (isNil(user?.id)) {
        return;
      }

      const response = await globalThis.fetch("/api/application", {
        body: JSON.stringify({
          id: application.id,
        }),
        method: "DELETE",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserApplications(user.id),
        });
        setIsDeleting(false);
      } else {
        toastError(response);
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
              modalStore.setApplicationToUpdate(application);
              modalStore.openModal("updateApplication");
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
