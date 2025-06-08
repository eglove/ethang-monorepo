import type { QuestionAnswer } from "@ethang/schemas/src/dashboard/question-answer-schema.ts";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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

import { qaStore } from "../../stores/qa-store.ts";

export const UpdateQaModal = () => {
  const { user } = useUser();
  const { isOpen, qa } = useStore(qaStore, (draft) => {
    return {
      isOpen: draft.isUpdateModalOpen,
      qa: draft.qaToUpdate,
    };
  });

  const handleChange = (key: keyof QuestionAnswer) => (value: string) => {
    if (isNil(qa)) {
      return;
    }

    qaStore.setQaToUpdate({
      ...qa,
      [key]: value,
    });
  };

  const { isPending, mutate } = useMutation(qaStore.updateQa(user?.id));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isNil(qa)) {
      mutate(qa);
    }
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          qaStore.setQaToUpdate(null);
        }

        qaStore.setIsUpdateModalOpen(value);
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
                qaStore.setIsUpdateModalOpen(false);
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
