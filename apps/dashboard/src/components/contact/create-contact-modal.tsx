import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
import {
  type CreateContact,
  createContactSchema,
} from "@ethang/schemas/src/dashboard/contact-schema.ts";
import {
  Button,
  DateInput,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import forEach from "lodash/forEach";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import set from "lodash/set";
import { DateTime } from "luxon";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";
import { getToken } from "../../utilities/token.ts";

export const CreateContactModal = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isOpen = useModalStore((state) => {
    return state.createContact;
  });

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: CreateContact) => {
      const response = await fetch("/api/contact", {
        body: JSON.stringify(data),
        headers: {
          Authorization: getToken(),
        },
        method: "POST",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allContacts(user?.id),
        });
        modalStore.closeModal("createContact");
      }
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = createContactSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );

    if (!parsed.success) {
      return;
    }

    forEach(parsed.data, (value, key) => {
      if (isNil(value) || isEmpty(value)) {
        set(parsed.data, [key], null);
        return;
      }

      if ("lastContact" === key || "expectedNextContact" === key) {
        set(parsed.data, [key], DateTime.fromJSDate(new Date(value)).toISO());
      }
    });

    mutate(parsed.data);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        modalStore.setIsModalOpen("createContact", value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Add Contact</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input isRequired label="Name" name="name" />
            <DateInput
              isRequired
              granularity="minute"
              label="Last Contacted"
              name="lastContact"
            />
            <Input label="Phone" name="phone" type="tel" />
            <Input label="Email" name="email" type="email" />
            <Input label="LinkedIn" name="linkedIn" type="url" />
            <DateInput
              granularity="minute"
              label="Expected Next Contact"
              name="expectedNextContact"
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                modalStore.closeModal("createContact");
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
