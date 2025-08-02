import { useStore } from "@ethang/store/use-store";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

import type { FetchedTodo } from "../../queries/get-all-todos.ts";

import { authStore } from "../../stores/auth-store.ts";
import { todoStore } from "../../stores/todo-store.ts";

type UpdateDeleteTodoProperties = {
  todo: FetchedTodo;
};

export const UpdateDeleteTodo = ({
  todo,
}: Readonly<UpdateDeleteTodoProperties>) => {
  const userId = useStore(authStore, (state) => state.userId);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStopDeleting = () => {
    setIsDeleting(false);
  };

  const { isPending: isDeletePending, mutate: deleteTodo } = useMutation(
    todoStore.deleteTodo(userId ?? undefined, handleStopDeleting),
  );

  const { isPending: isCompletePending, mutate: completeTodo } = useMutation(
    todoStore.completeTodo(),
  );

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        onPress={() => {
          completeTodo(todo);
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
              todoStore.setTodoToUpdate(todo);
              todoStore.setIsUpdateModalOpen(true);
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
              deleteTodo(todo);
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
