import type { PortableTextBlock } from "@portabletext/types";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";

import type { CalendarComponentEvent } from "../../routes/calendar.tsx";

import { AddToCalendar } from "../add-to-calendar.tsx";
import { CalendarModalContent } from "./calendar-modal-content.tsx";

type CalendarModalProperties = {
  readonly isOpen: boolean;
  readonly onOpenChange: () => void;
  readonly selectedEvent: CalendarComponentEvent;
};

export const CalendarModal = ({
  isOpen,
  onOpenChange,
  selectedEvent,
}: CalendarModalProperties) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
  const description = selectedEvent.description as
    | PortableTextBlock
    | undefined;

  return (
    <Modal backdrop="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => {
          return (
            <>
              <ModalHeader>{selectedEvent.title}</ModalHeader>
              <ModalBody>
                <CalendarModalContent selectedEvent={selectedEvent} />
              </ModalBody>
              <ModalFooter>
                <AddToCalendar
                  description={description}
                  start={selectedEvent.start}
                  title={selectedEvent.title}
                  buttonProps={{ color: "primary" }}
                />
                <Button color="danger" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          );
        }}
      </ModalContent>
    </Modal>
  );
};
