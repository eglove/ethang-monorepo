import type { QuestionAnswer } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";
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

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";
import { getToken } from "../../utilities/token.ts";

export const UpdateQaModal = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isOpen = useModalStore((state) => {
    return state.updateQa;
  });
  const qa = useModalStore((state) => {
    return state.qaToUpdate;
  });

  const handleChange = (key: keyof QuestionAnswer) => (value: string) => {
    if (isNil(qa)) {
      return;
    }

    modalStore.setQaToUpdate({
      ...qa,
      [key]: value,
    });
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/question-answer", {
        body: JSON.stringify({ ...qa, userId: user?.id }),
        headers: {
          Authorization: getToken(),
        },
        method: "PUT",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserQuestionAnswers(user?.id),
        });
        modalStore.closeModal("updateQa");
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
          modalStore.setQaToUpdate(null);
        }

        modalStore.setIsModalOpen("updateQa", value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Update Q/A</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input
              isRequired
              label="Question"
              name="question"
              onValueChange={handleChange("question")}
              value={qa?.question ?? ""}
            />
            <Textarea
              isRequired
              label="Answer"
              name="answer"
              onValueChange={handleChange("answer")}
              value={qa?.answer ?? ""}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                modalStore.closeModal("updateQa");
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
