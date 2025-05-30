import type { Todo } from "@ethang/schemas/src/dashboard/todo-schema.ts";

import { useUser } from "@clerk/clerk-react";
import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore } from "../../global-stores/modal-store.ts";
import { getToken } from "../../utilities/token.ts";

type UpdateDeleteTodoProperties = {
  todo: Todo;
};

export const UpdateDeleteTodo = ({
  todo,
}: Readonly<UpdateDeleteTodoProperties>) => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [isDeleting, setIsDeleting] = useState(false);

  const { isPending: isDeletePending, mutate: deleteTodo } = useMutation({
    mutationFn: async () => {
      if (isNil(user?.id)) {
        return;
      }

      const response = await globalThis.fetch("/api/todo", {
        body: JSON.stringify({ id: todo.id }),
        headers: {
          Authorization: getToken(),
        },
        method: "DELETE",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserTodos(user.id),
        });
        setIsDeleting(false);
      }
    },
  });

  const { isPending: isCompletePending, mutate: completeTodo } = useMutation({
    mutationFn: async () => {
      if (isNil(todo)) {
        return;
      }

      let isOk = false;

      if (isNil(todo.recurs)) {
        const response = await globalThis.fetch("/api/todo", {
          body: JSON.stringify({
            id: todo.id,
          }),
          headers: {
            Authorization: getToken(),
          },
          method: "DELETE",
        });

        isOk = response.ok;
      } else {
        const nextDue = DateTime.now()
          .plus({ millisecond: todo.recurs })
          .toISO();

        const response = await globalThis.fetch("/api/todo", {
          body: JSON.stringify({
            ...todo,
            dueDate: nextDue,
          }),
          headers: { Authorization: getToken() },
          method: "PUT",
        });

        isOk = response.ok;
      }

      if (isOk) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserTodos(user?.id),
        });
      }
    },
  });

  return (
    <div className="flex gap-2 items-center">
      <Button
        isIconOnly
        onPress={() => {
          completeTodo();
        }}
        arria-label="Confirm complete"
        className={twMerge((isDeleting || isNil(todo.dueDate)) && "opacity-0")}
        color="success"
        isDisabled={isDeleting || isNil(todo.dueDate)}
        size="sm"
      >
        <CheckIcon />
      </Button>
      {!isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              modalStore.setTodoToUpdate(todo);
              modalStore.openModal("updateTodo");
            }}
            aria-label="Update ToDo"
            color="primary"
            isDisabled={isDeletePending || isCompletePending}
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
            isDisabled={isCompletePending}
            isLoading={isDeletePending}
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
              deleteTodo();
            }}
            aria-label="Confirm delete"
            color="danger"
            isDisabled={isCompletePending}
            isLoading={isDeletePending}
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
            isDisabled={isCompletePending}
            isLoading={isDeletePending}
            size="sm"
          >
            <XIcon />
          </Button>
        </>
      )}
    </div>
  );
};
