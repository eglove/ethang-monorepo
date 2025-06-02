import type { CreateQuestionAnswer } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { z } from "zod";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";

export const CreateQaModal = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isOpen = useModalStore((state) => {
    return state.createQa;
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: CreateQuestionAnswer) => {
      const response = await fetch("/api/question-answer", {
        body: JSON.stringify(data),
        method: "POST",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserQuestionAnswers(user?.id),
        });
        modalStore.closeModal("createQa");
      }
    },
  });

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
        modalStore.setIsModalOpen("createQa", value);
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
                modalStore.closeModal("createQa");
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
