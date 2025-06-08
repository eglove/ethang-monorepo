import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
import { createContactSchema } from "@ethang/schemas/src/dashboard/contact-schema.ts";
import { useStore } from "@ethang/store/use-store";
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
import { useMutation } from "@tanstack/react-query";
import forEach from "lodash/forEach";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import set from "lodash/set";
import { DateTime } from "luxon";

import { getDateTimeInputNow } from "../../../worker/utilities/heroui.ts";
import { contactStore } from "../../stores/contact-store.ts";

export const CreateContactModal = () => {
  const { user } = useUser();
  const isOpen = useStore(contactStore, (state) => {
    return state.isCreateModalOpen;
  });

  const { isPending, mutate } = useMutation(
    contactStore.createContact(user?.id),
  );

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
        contactStore.setIsCreateModalOpen(value);
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
              defaultValue={getDateTimeInputNow()}
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
                contactStore.setIsCreateModalOpen(false);
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
