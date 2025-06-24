import { useToggle } from "@ethang/hooks/use-toggle";
import { useStore } from "@ethang/store/use-store";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, Trash2Icon, XIcon } from "lucide-react";

import { authStore } from "../../stores/auth-store.ts";
import { qaStore } from "../../stores/qa-store.ts";

type QaDeleteButtonProperties = {
  id: string;
};

export const QaDeleteButton = ({ id }: Readonly<QaDeleteButtonProperties>) => {
  const userId = useStore(authStore, (state) => state.userId);
  const [isDeleting, toggleIsDeleting] = useToggle(false);

  const { isPending, mutate } = useMutation(
    qaStore.deleteQa(userId ?? undefined, () => {
      toggleIsDeleting();
    }),
  );

  return (
    <>
      {!isDeleting && (
        <Button
          isIconOnly
          onPress={() => {
            toggleIsDeleting();
          }}
          aria-label="Delete"
          color="danger"
        >
          <Trash2Icon />
        </Button>
      )}
      {isDeleting && (
        <div className="flex gap-2">
          <Button
            isIconOnly
            onPress={() => {
              mutate(id);
            }}
            aria-label="Confirm Delete"
            color="primary"
            isLoading={isPending}
          >
            <CheckIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              toggleIsDeleting();
            }}
            aria-label="Cancel Delete"
            isLoading={isPending}
          >
            <XIcon />
          </Button>
        </div>
      )}
    </>
  );
};
