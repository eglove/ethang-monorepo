import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from "@heroui/modal";
import { twMerge } from "tailwind-merge";

import type { CalendarEvent } from "./calendar-types.ts";

import { AddToCalendarButton } from "./add-to-calendar-button.tsx";

type CalendarEventModalProperties = {
  classNames?: {
    button?: string;
  };
  event: CalendarEvent;
};

const timeFormat = {
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  month: "short",
} satisfies Intl.DateTimeFormatOptions;

export const openNewTab = (url: string) => {
  if ("undefined" !== typeof globalThis) {
    globalThis.open(url, "_blank")?.focus();
  }
};

export const CalendarEventModal = ({
  classNames,
  event,
}: Readonly<CalendarEventModalProperties>) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button
        as="ol"
        className={twMerge("grid place-items-center gap-0", classNames?.button)}
        color="primary"
        key={event.id}
        onPress={onOpen}
        size="sm"
        variant="solid"
      >
        <p className="text-wrap">{event.title}</p>
        <time dateTime={event.start.toDateString()}>
          {event.start.toLocaleString(undefined, {
            hour: "numeric",
            minute: "numeric",
          })}
        </time>
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => {
            return (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {event.title}
                </ModalHeader>
                <ModalBody>
                  <div>
                    {event.start.toLocaleString(undefined, timeFormat)} -{" "}
                    {event.end.toLocaleString(undefined, timeFormat)}
                  </div>
                  <div>{event.description}</div>
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" onPress={onClose} variant="light">
                    Close
                  </Button>
                  <AddToCalendarButton event={event} />
                </ModalFooter>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};
