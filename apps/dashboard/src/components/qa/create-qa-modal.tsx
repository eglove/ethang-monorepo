import type { FormEvent } from "react";

import { useMutation } from "@apollo/client";
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
import isNil from "lodash/isNil.js";
import { z } from "zod";

import { createQuestionAnswer } from "../../graphql/mutations/create-question-answer.ts";
import { getAllQuestionAnswers } from "../../graphql/queries/get-all-question-answers.ts";
import { authStore } from "../../stores/auth-store.ts";
import { qaStore } from "../../stores/qa-store.ts";

export const CreateQaModal = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const isOpen = useStore(qaStore, (draft) => {
    return draft.isCreateModalOpen;
  });

  const [handleCreate, { loading }] = useMutation(createQuestionAnswer);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({ answer: z.string(), question: z.string() })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(userId) || !parsed.success) {
      return;
    }

    handleCreate({
      onCompleted: () => {
        qaStore.setIsCreateModalOpen(false);
      },
      refetchQueries: [getAllQuestionAnswers],
      variables: {
        input: parsed.data,
      },
    }).catch(globalThis.console.error);
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
            <Button color="primary" isLoading={loading} type="submit">
              Create
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
