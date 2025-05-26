import { useUser } from "@clerk/clerk-react";
import { useToggle } from "@ethang/hooks/use-toggle";
import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Trash2Icon, XIcon } from "lucide-react";

import { queryKeys } from "../../data/queries/queries.ts";
import { getToken } from "../../utilities/token.ts";

type QaDeleteButtonProperties = {
  id: string;
};

export const QaDeleteButton = ({ id }: Readonly<QaDeleteButtonProperties>) => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isDeleting, toggleIsDeleting] = useToggle(false);

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const response = await globalThis.fetch("/api/question-answer", {
        body: JSON.stringify({
          id,
          userId: user?.id,
        }),
        headers: {
          Authorization: getToken(),
        },
        method: "DELETE",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserQuestionAnswers(user?.id),
        });
        toggleIsDeleting();
      }
    },
  });

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
              mutate();
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
