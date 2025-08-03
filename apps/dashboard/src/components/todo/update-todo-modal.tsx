import type { Todo } from "@ethang/schemas/dashboard/todo-schema.ts";
import type { FormEvent } from "react";

import { useMutation } from "@apollo/client";
import { useStore } from "@ethang/store/use-store";
import {
  Button,
  DateInput,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";
import ms from "ms";

import { convertIsoToDateTimeInput } from "../../../worker/utilities/heroui.ts";
import { updateTodo } from "../../graphql/mutations/update-todo.ts";
import { getAllTodos } from "../../graphql/queries/get-all-todos.ts";
import { todoStore } from "../../stores/todo-store.ts";

export const UpdateTodoModal = () => {
  const { isOpen, todo } = useStore(todoStore, (state) => {
    return {
      isOpen: state.isUpdateModalOpen,
      todo: state.todoToUpdate,
    };
  });

  const handleChange = (key: keyof Todo) => (value: string) => {
    if (isNil(todo)) {
      return;
    }

    todoStore.setTodoToUpdate({
      ...todo,
      [key]: value,
    });
  };

  const [handleUpdate, { loading }] = useMutation(updateTodo, {
    onCompleted: () => {
      todoStore.setIsUpdateModalOpen(false);
    },
    refetchQueries: [getAllTodos],
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleUpdate({
      variables: {
        input: { ...todo, __typename: undefined, userId: undefined },
      },
    }).catch(globalThis.console.error);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          todoStore.setTodoToUpdate(null);
        }

        todoStore.setIsUpdateModalOpen(value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Update Todo</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <div>{ms(ms("30 Days"), { long: true })}</div>
            <Input
              isRequired
              label="Title"
              name="title"
              onValueChange={handleChange("title")}
              value={todo?.title ?? ""}
            />
            <DateInput
              value={convertIsoToDateTimeInput(
                todo?.dueDate ?? DateTime.now().toUTC().toString(),
              )}
              granularity="minute"
              label="Due Date"
              name="dueDate"
            />
            <Textarea
              label="Description"
              name="description"
              onValueChange={handleChange("description")}
              value={todo?.description ?? ""}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                todoStore.setIsUpdateModalOpen(false);
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={loading} type="submit">
              Update
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
