import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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

import { qaStore, useQaStore } from "../../data/qa-store.ts";

export const CreateQaModal = () => {
  const { user } = useUser();

  const isOpen = useQaStore((draft) => {
    return draft.isCreateModalOpen;
  });

  const { isPending, mutate } = useMutation(qaStore.createQa(user?.id));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({ answer: z.string(), question: z.string() })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(user?.id) || !parsed.success) {
      return;
    }

    mutate({ ...parsed.data, userId: user.id });
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
