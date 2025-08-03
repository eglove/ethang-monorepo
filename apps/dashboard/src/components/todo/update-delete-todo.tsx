import { useMutation } from "@apollo/client";
import { Button } from "@heroui/react";
import isNil from "lodash/isNil.js";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { deleteTodo } from "../../graphql/mutations/delete-todo.ts";
import { updateTodo } from "../../graphql/mutations/update-todo.ts";
import {
  type FetchedTodo,
  getAllTodos,
} from "../../graphql/queries/get-all-todos.ts";
import { todoStore } from "../../stores/todo-store.ts";

type UpdateDeleteTodoProperties = {
  todo: FetchedTodo;
};

export const UpdateDeleteTodo = ({
  todo,
}: Readonly<UpdateDeleteTodoProperties>) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const [handleDelete, { loading: deleteLoading }] = useMutation(deleteTodo, {
    onCompleted: () => {
      setIsDeleting(false);
    },
    refetchQueries: [getAllTodos],
  });

  const [handleUpdate, { loading: updateLoading }] = useMutation(updateTodo, {
    onCompleted: () => {
      todoStore.setIsUpdateModalOpen(false);
    },
    refetchQueries: [getAllTodos],
  });

  return (
    <div className="flex items-center gap-2">
      <Button
        isIconOnly
        onPress={() => {
          if (isNil(todo.recurs)) {
            handleDelete({
              variables: { input: { id: todo.id } },
            }).catch(globalThis.console.error);
          } else {
            handleUpdate({
              variables: {
                input: { ...todo, __typename: undefined, userId: undefined },
              },
            }).catch(globalThis.console.error);
          }
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
            isDisabled={deleteLoading || updateLoading}
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
            isDisabled={updateLoading}
            isLoading={deleteLoading}
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
              handleDelete({ variables: { input: { id: todo.id } } }).catch(
                globalThis.console.error,
              );
            }}
            aria-label="Confirm delete"
            color="danger"
            isDisabled={updateLoading}
            isLoading={deleteLoading}
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
            isDisabled={updateLoading}
            isLoading={deleteLoading}
            size="sm"
          >
            <XIcon />
          </Button>
        </>
      )}
    </div>
  );
};
