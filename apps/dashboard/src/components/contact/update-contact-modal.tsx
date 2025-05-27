import type { Contact } from "@ethang/schemas/src/dashboard/contact-schema.ts";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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
import { parseAbsoluteToLocal } from "@internationalized/date";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";
import { getToken } from "../../utilities/token.ts";

const getDateTimeInputConversion = (value: null | string | undefined) => {
  return isNil(value)
    ? null
    : // @ts-expect-error HeroUI types suck
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      (parseAbsoluteToLocal(
        DateTime.fromISO(value).toUTC().toString(),
      ) as Parameters<typeof DateInput>[0]["value"]);
};

export const UpdateContactModal = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isOpen = useModalStore((state) => {
    return state.updateContact;
  });
  const contact = useModalStore((state) => {
    return state.contactToUpdate;
  });

  const handleChange = (key: keyof Contact) => (value: string) => {
    if (isNil(contact)) {
      return;
    }

    modalStore.setContactToUpdate({
      ...contact,
      [key]: value,
    });
  };

  const handleDateInputChange =
    (key: keyof Contact) =>
    (value: Parameters<typeof DateInput>[0]["value"]) => {
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

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const response = await globalThis.fetch("/api/contact", {
        body: JSON.stringify({
          ...contact,
          userId: user?.id,
        }),
        headers: {
          Authorization: getToken(),
        },
        method: "PUT",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.allContacts(user?.id),
        });
        modalStore.closeModal("updateContact");
      }
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutate();
  };

  const lastContactDateTime = getDateTimeInputConversion(contact?.lastContact);
  const expectedNextContact = getDateTimeInputConversion(
    contact?.expectedNextContact,
  );

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          modalStore.setContactToUpdate(null);
        }
        modalStore.setIsModalOpen("updateContact", value);
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
            {/* @ts-expect-error HeroUI types suck */}
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
            {/* @ts-expect-error HeroUI types suck */}
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
                modalStore.closeModal("updateContact");
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
