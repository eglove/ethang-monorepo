import type { JobApplication } from "@ethang/schemas/dashboard/application-schema.ts";
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
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";

import { applicationStore } from "../../stores/application-store.ts";
import { authStore } from "../../stores/auth-store.ts";
import { getFormDate } from "../../utilities/form.ts";

export const UpdateJobApplicationModal = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const { applicationToUpdate, isUpdateModalOpen } = useStore(
    applicationStore,
    (state) => {
      return {
        applicationToUpdate: state.applicationToUpdate,
        isUpdateModalOpen: state.isUpdateModalOpen,
      };
    },
  );

  const handleChange = (key: keyof JobApplication) => (value: string) => {
    if (isNil(applicationToUpdate)) {
      return;
    }

    applicationStore.setApplicationToUpdate({
      ...applicationToUpdate,
      [key]: value,
    });
  };

  const { isPending, mutate } = useMutation(
    applicationStore.updateApplication(userId ?? undefined),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isNil(applicationToUpdate)) {
      return;
    }

    mutate(applicationToUpdate);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          applicationStore.setApplicationToUpdate(null);
        }
        applicationStore.setIsUpdateModalOpen(value);
      }}
      isOpen={isUpdateModalOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Update Job Application</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input
              isRequired
              label="Title"
              name="title"
              onValueChange={handleChange("title")}
              value={applicationToUpdate?.title ?? ""}
            />
            <Input
              isRequired
              label="Company"
              name="company"
              onValueChange={handleChange("company")}
              value={applicationToUpdate?.company ?? ""}
            />
            <Input
              isRequired
              label="URL"
              name="url"
              onValueChange={handleChange("url")}
              type="url"
              value={applicationToUpdate?.url ?? ""}
            />
            <Input
              label="Job Board URL"
              name="jobBoardUrl"
              onValueChange={handleChange("jobBoardUrl")}
              type="url"
              value={applicationToUpdate?.jobBoardUrl ?? ""}
            />
            <Input
              isRequired
              label="Applied"
              name="applied"
              onValueChange={handleChange("applied")}
              type="date"
              value={getFormDate(applicationToUpdate?.applied)}
            />
            <Input
              label="Rejected"
              name="rejected"
              onValueChange={handleChange("rejected")}
              type="date"
              value={getFormDate(applicationToUpdate?.rejected)}
            />
            <Input
              label="Email"
              name="dmUrl"
              onValueChange={handleChange("dmUrl")}
              value={applicationToUpdate?.dmUrl ?? ""}
            />
            <Input
              label="Email Sent"
              name="dmSent"
              onValueChange={handleChange("dmSent")}
              type="date"
              value={getFormDate(applicationToUpdate?.dmSent)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                applicationStore.setIsUpdateModalOpen(false);
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
