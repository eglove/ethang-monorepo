import type { FormEvent } from "react";

import { useMutation } from "@apollo/client/react";
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
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import type { contactsModel } from "../../../generated/prisma/models/contacts.ts";

import {
  convertIsoToDateTimeInput,
  type DateInputValue,
} from "../../../worker/utilities/heroui.ts";
import { updateContact } from "../../graphql/mutations/update-contact.ts";
import { getAllContacts } from "../../graphql/queries/get-all-contacts.ts";
import { contactStore } from "../../stores/contact-store.ts";

export const UpdateContactModal = () => {
  const { contact, isOpen } = useStore(contactStore, (state) => {
    return {
      contact: state.contactToUpdate,
      isOpen: state.isUpdateModalOpen,
    };
  });

  const handleChange = (key: keyof contactsModel) => (value: string) => {
    if (isNil(contact)) {
      return;
    }

    contactStore.setContactToUpdate({
      ...contact,
      [key]: value,
    });
  };

  const handleDateInputChange =
    (key: keyof contactsModel) => (value: DateInputValue) => {
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

  const [handleUpdate, { loading }] = useMutation(updateContact);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isNil(contact)) {
      handleUpdate({
        onCompleted: () => {
          contactStore.setIsUpdateModalOpen(false);
          contactStore.setContactToUpdate(null);
        },
        refetchQueries: [getAllContacts],
        variables: {
          input: { ...contact, __typename: undefined, userId: undefined },
        },
      }).catch(globalThis.console.error);
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
            <Button color="primary" isLoading={loading} type="submit">
              Update
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
