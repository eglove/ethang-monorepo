import type { FormEvent } from "react";

import { useStore } from "@ethang/store/use-store";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Textarea,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { z } from "zod";

import { authStore } from "../../stores/auth-store.ts";
import { qaStore } from "../../stores/qa-store.ts";

export const CreateQaModal = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const isOpen = useStore(qaStore, (draft) => {
    return draft.isCreateModalOpen;
  });

  const { isPending, mutate } = useMutation(
    qaStore.createQa(userId ?? undefined),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({ answer: z.string(), question: z.string() })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(userId) || !parsed.success) {
      return;
    }

    mutate({ ...parsed.data, userId });
  };

  return (
    <Modal
      onOpenChange={(value) => {
        qaStore.setIsCreateModalOpen(value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Add Q/A</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input isRequired label="Question" name="question" />
            <Textarea isRequired label="Answer" name="answer" />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                qaStore.setIsCreateModalOpen(false);
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={isPending} type="submit">
              Create
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
