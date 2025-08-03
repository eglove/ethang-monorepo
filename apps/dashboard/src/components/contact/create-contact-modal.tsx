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
import isString from "lodash/isString";
import set from "lodash/set";

import contactsCreateInputSchema from "../../../generated/zod/inputTypeSchemas/contactsCreateInputSchema.ts";
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
    const entries = Object.fromEntries(new FormData(event.currentTarget));

    forEach(entries, (value, key) => {
      if (isNil(value) || isEmpty(value)) {
        set(entries, [key], null);
        return;
      }

      if ("lastContact" === key || "expectedNextContact" === key) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const _dateValue = get(entries, [key]) as unknown as
          | Date
          | null
          | string
          | undefined;

        if (!isNil(_dateValue)) {
          const isoValue = isString(_dateValue)
            ? convertDateTimeInputToIso(parseZonedDateTime(_dateValue))
            : _dateValue.toISOString();
          set(entries, [key], isoValue);
        }
      }
    });

    const parsed = contactsCreateInputSchema.safeParse(entries);

    if (!parsed.success) {
      return;
    }

    handleCreate({
      onCompleted: () => {
        contactStore.setIsCreateModalOpen(false);
      },
      refetchQueries: [getAllContacts],
      variables: { input: { ...parsed.data } },
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
