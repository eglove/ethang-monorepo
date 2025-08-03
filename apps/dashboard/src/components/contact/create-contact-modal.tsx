import type { FormEvent } from "react";

import { useMutation } from "@apollo/client";
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
import { parseZonedDateTime } from "@internationalized/date";
import forEach from "lodash/forEach";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import set from "lodash/set";
import { z } from "zod";

import {
  convertDateTimeInputToIso,
  getDateTimeInputNow,
} from "../../../worker/utilities/heroui.ts";
import { createContact } from "../../graphql/mutations/create-contact.ts";
import { getAllContacts } from "../../graphql/queries/get-all-contacts.ts";
import { contactStore } from "../../stores/contact-store.ts";

export const CreateContactModal = () => {
  const isOpen = useStore(contactStore, (state) => {
    return state.isCreateModalOpen;
  });

  const [handleCreate, { loading }] = useMutation(createContact);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({
        email: z.string().nullable(),
        expectedNextContact: z.string().nullable(),
        lastContact: z.string(),
        linkedIn: z.string().nullable(),
        name: z.string(),
        phone: z.string().nullable(),
      })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (!parsed.success) {
      return;
    }

    forEach(parsed.data, (value, key) => {
      if (isNil(value) || isEmpty(value)) {
        set(parsed.data, [key], null);
        return;
      }

      if ("lastContact" === key || "expectedNextContact" === key) {
        const _dateValue = get(parsed, ["data", key]);

        if (!isNil(_dateValue)) {
          const isoValue = convertDateTimeInputToIso(
            parseZonedDateTime(_dateValue),
          );
          set(parsed.data, [key], isoValue);
        }
      }
    });

    handleCreate({
      onCompleted: () => {
        contactStore.setIsCreateModalOpen(false);
      },
      refetchQueries: [getAllContacts],
      variables: { input: { ...parsed.data, __typename: undefined } },
    }).catch(globalThis.console.error);
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
            <Button color="primary" isLoading={loading} type="submit">
              Create
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
