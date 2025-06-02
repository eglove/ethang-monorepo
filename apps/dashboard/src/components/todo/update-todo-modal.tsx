import type { Todo } from "@ethang/schemas/src/dashboard/todo-schema.ts";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";
import ms from "ms";

import { convertIsoToDateTimeInput } from "../../../worker/utilities/heroui.ts";
import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";

export const UpdateTodoModal = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const todo = useModalStore((state) => {
    return state.todoToUpdate;
  });

  const isOpen = useModalStore((state) => {
    return state.updateTodo;
  });

  const handleChange = (key: keyof Todo) => (value: string) => {
    if (isNil(todo)) {
      return;
    }

    modalStore.setTodoToUpdate({
      ...todo,
      [key]: value,
    });
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      if (isNil(todo)) {
        return;
      }

      const response = await fetch("/api/todo", {
        body: JSON.stringify({
          ...todo,
          userId: user?.id,
        }),
        method: "PUT",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserTodos(user?.id),
        });
        modalStore.closeModal("updateTodo");
      }
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutate();
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          modalStore.setTodoToUpdate(null);
        }

        modalStore.setIsModalOpen("updateTodo", value);
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
                modalStore.closeModal("updateTodo");
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={isPending} type="submit">
              Update
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
