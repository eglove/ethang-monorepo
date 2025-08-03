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
} from "@heroui/react";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import applicationsCreateInputSchema from "../../../generated/zod/inputTypeSchemas/applicationsCreateInputSchema.ts";
import { createJobApplication } from "../../graphql/mutations/create-job-application.ts";
import { getAllApplications } from "../../graphql/queries/get-all-applications.ts";
import { applicationStore } from "../../stores/application-store.ts";
import { authStore } from "../../stores/auth-store.ts";

export const CreateJobApplicationModal = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const isCreateModalOpen = useStore(applicationStore, (state) => {
    return state.isCreateModalOpen;
  });

  const [create, { loading }] = useMutation(createJobApplication);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = applicationsCreateInputSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );

    if (isNil(userId) || !parsed.success) {
      return;
    }
    create({
      onCompleted: () => {
        applicationStore.setIsCreateModalOpen(false);
      },
      refetchQueries: [getAllApplications],
      variables: {
        input: {
          ...parsed.data,
          applied: DateTime.now().toISO(),
        },
      },
    }).catch(globalThis.console.error);
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
            <Button color="primary" isLoading={loading} type="submit">
              Create
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
