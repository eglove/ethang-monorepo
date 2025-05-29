import type { JobApplication } from "@ethang/schemas/src/dashboard/application-schema.ts";
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
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";
import { formDateToIso, getFormDate } from "../../utilities/form.ts";
import { getToken } from "../../utilities/token.ts";

export const UpdateJobApplicationModal = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const jobApplication = useModalStore((state) => {
    return state.applicationToUpdate;
  });

  const isOpen = useModalStore((state) => {
    return state.updateApplication;
  });

  const handleChange = (key: keyof JobApplication) => (value: string) => {
    if (isNil(jobApplication)) {
      return;
    }

    modalStore.setApplicationToUpdate({
      ...jobApplication,
      [key]: value,
    });
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: JobApplication) => {
      const response = await fetch("/api/application", {
        body: JSON.stringify({
          ...data,
          applied: formDateToIso(data.applied),
          rejected: isNil(data.rejected) ? null : formDateToIso(data.rejected),
        }),
        headers: {
          Authorization: getToken(),
        },
        method: "PUT",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserApplications(user?.id),
        });
        modalStore.closeModal("updateApplication");
      }
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isNil(jobApplication)) {
      return;
    }

    mutate(jobApplication);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          modalStore.setApplicationToUpdate(null);
        }
        modalStore.setIsModalOpen("updateApplication", value);
      }}
      isOpen={isOpen}
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
              value={jobApplication?.title ?? ""}
            />
            <Input
              isRequired
              label="Company"
              name="company"
              onValueChange={handleChange("company")}
              value={jobApplication?.company ?? ""}
            />
            <Input
              isRequired
              label="URL"
              name="url"
              onValueChange={handleChange("url")}
              type="url"
              value={jobApplication?.url ?? ""}
            />
            <Input
              isRequired
              label="Applied"
              name="applied"
              type="date"
              value={getFormDate(jobApplication?.applied)}
            />
            <Input
              label="Rejected"
              name="rejected"
              onValueChange={handleChange("rejected")}
              type="date"
              value={getFormDate(jobApplication?.rejected)}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                modalStore.closeModal("updateApplication");
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
