import type { Contact } from "@ethang/schemas/dashboard/contact-schema.ts";
import type { FormEvent } from "react";

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
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import {
  convertIsoToDateTimeInput,
  type DateInputValue,
} from "../../../worker/utilities/heroui.ts";
import { authStore } from "../../stores/auth-store.ts";
import { contactStore } from "../../stores/contact-store.ts";

export const UpdateContactModal = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const { contact, isOpen } = useStore(contactStore, (state) => {
    return {
      contact: state.contactToUpdate,
      isOpen: state.isUpdateModalOpen,
    };
  });

  const handleChange = (key: keyof Contact) => (value: string) => {
    if (isNil(contact)) {
      return;
    }

    contactStore.setContactToUpdate({
      ...contact,
      [key]: value,
    });
  };

  const handleDateInputChange =
    (key: keyof Contact) => (value: DateInputValue) => {
      if (isNil(contact)) {
        return;
      }

      if (!isNil(value)) {
        const zone = DateTime.now().zoneName;
        const newValue = DateTime.fromJSDate(value.toDate(zone)).toISO();

        if (!isNil(newValue)) {
          handleChange(key)(newValue);
        }
      }
    };

  const { isPending, mutate } = useMutation(
    contactStore.updateContact(userId ?? undefined),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isNil(contact)) {
      mutate(contact);
    }
  };

  const lastContactDateTime = convertIsoToDateTimeInput(contact?.lastContact);
  const expectedNextContact = convertIsoToDateTimeInput(
    contact?.expectedNextContact,
  );

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          contactStore.setContactToUpdate(null);
        }

        contactStore.setIsUpdateModalOpen(value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Update Contact</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input
              isRequired
              label="Name"
              name="name"
              onValueChange={handleChange("name")}
              value={contact?.name ?? ""}
            />
            <DateInput
              isRequired
              granularity="minute"
              label="Last Contacted"
              name="lastContact"
              onChange={handleDateInputChange("lastContact")}
              value={lastContactDateTime}
            />
            <Input
              label="Phone"
              name="phone"
              onValueChange={handleChange("phone")}
              type="tel"
              value={contact?.phone ?? ""}
            />
            <Input
              label="Email"
              name="email"
              onValueChange={handleChange("email")}
              type="email"
              value={contact?.email ?? ""}
            />
            <Input
              label="LinkedIn"
              name="linkedIn"
              onValueChange={handleChange("linkedIn")}
              type="url"
              value={contact?.linkedIn ?? ""}
            />
            <DateInput
              granularity="minute"
              label="Expected Next Contact"
              name="expectedNextContact"
              onChange={handleDateInputChange("expectedNextContact")}
              value={expectedNextContact}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                contactStore.setIsUpdateModalOpen(false);
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
