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
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";
import { z } from "zod";

import { applicationStore } from "../../stores/application-store.ts";

export const CreateJobApplicationModal = () => {
  const { user } = useUser();

  const isCreateModalOpen = useStore(applicationStore, (state) => {
    return state.isCreateModalOpen;
  });

  const { isPending, mutate } = useMutation(
    applicationStore.createApplication(user?.id),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({
        company: z.string(),
        jobBoardUrl: z.string().optional(),
        title: z.string(),
        url: z.string(),
      })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(user?.id) || !parsed.success) {
      return;
    }

    mutate({
      applied: DateTime.now().toISO(),
      company: parsed.data.company,
      interviewRounds: [],
      jobBoardUrl: parsed.data.jobBoardUrl,
      rejected: null,
      title: parsed.data.title,
      url: parsed.data.url,
      userId: user.id,
    });
  };

  return (
    <Modal
      onOpenChange={(value) => {
        applicationStore.setIsCreateModalOpen(value);
      }}
      isOpen={isCreateModalOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Add Job Application</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input isRequired label="Title" name="title" />
            <Input isRequired label="Company" name="company" />
            <Input isRequired label="URL" name="url" type="url" />
            <Input label="Job Board URL" name="jobBoardUrl" type="url" />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                applicationStore.setIsCreateModalOpen(false);
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
