import type { CreateJobApplication } from "@ethang/schemas/src/dashboard/application-schema";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import {
  addToast,
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
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";
import { z } from "zod";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.js";
import { getToken } from "../../utilities/token.ts";

export const CreateJobApplicationModal = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isOpen = useModalStore((snapshot) => {
    return snapshot.createJobApplication;
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: CreateJobApplication) => {
      const response = await globalThis.fetch("/api/application", {
        body: JSON.stringify(data),
        headers: {
          Authorization: getToken(),
        },
        method: "POST",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allUserApplications(user?.id),
        });
        modalStore.closeModal("createJobApplication");
      } else {
        const body = await parseFetchJson(
          response,
          z.object({ error: z.string() }),
        );

        addToast({
          color: "danger",
          description: isError(body) ? "Unknown error" : body.error,
          title: "Failed to create application.",
        });
      }
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({
        company: z.string(),
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
      rejected: null,
      title: parsed.data.title,
      url: parsed.data.url,
      userId: user.id,
    });
  };

  return (
    <Modal
      onOpenChange={(value) => {
        modalStore.setIsModalOpen("createJobApplication", value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Add Job Application</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input isRequired label="Title" name="title" />
            <Input isRequired label="Company" name="company" />
            <Input isRequired label="URL" name="url" type="url" />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                modalStore.closeModal("createJobApplication");
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
