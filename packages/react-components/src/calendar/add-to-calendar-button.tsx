import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Image } from "@heroui/image";
import {
  type CalendarEvent as CalendarEventInterface,
  google,
  ics,
  office365,
  outlook,
  yahoo,
} from "calendar-link";
import isNil from "lodash/isNil";

import type { CalendarEvent } from "./calendar-types.ts";

import { openNewTab } from "./calendar-event-modal.tsx";

type AddToCalendarButtonProperties = {
  event: CalendarEvent;
};

export const AddToCalendarButton = ({
  event,
}: Readonly<AddToCalendarButtonProperties>) => {
  const handleAddToCalendar = (
    type: "google" | "ics" | "office365" | "outlook" | "yahoo",
  ) => {
    const data = {
      description: isNil(event.plainTextHtmlDescription)
        ? ""
        : event.plainTextHtmlDescription,
      end: event.end.toISOString(),
      start: event.start.toISOString(),
      title: event.title,
    } satisfies CalendarEventInterface;

    return () => {
      switch (type) {
        case "google": {
          openNewTab(google(data));
          break;
        }
        case "ics": {
          openNewTab(ics(data));
          break;
        }
        case "office365": {
          openNewTab(office365(data));
          break;
        }
        case "outlook": {
          openNewTab(outlook(data));
          break;
        }
        case "yahoo": {
          openNewTab(yahoo(data));
          break;
        }
      }
    };
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button color="primary">Add To Calendar</Button>
      </DropdownTrigger>
      <DropdownMenu aria-label="Calendar Options" selectionMode="single">
        <DropdownItem key="ics" onPress={handleAddToCalendar("ics")}>
          <div className="flex items-center gap-2">
            <Image className="w-4" src="/images/apple-logo.png" />
            Apple / ICS
          </div>
        </DropdownItem>
        <DropdownItem key="google" onPress={handleAddToCalendar("google")}>
          <div className="flex items-center gap-2">
            <Image className="w-4" src="/images/google-logo.png" />
            Google
          </div>
        </DropdownItem>
        <DropdownItem key="outlook" onPress={handleAddToCalendar("outlook")}>
          <div className="flex items-center gap-2">
            <Image className="w-4" src="/images/outlook-logo.png" />
            Outlook
          </div>
        </DropdownItem>
        <DropdownItem
          key="office365"
          onPress={handleAddToCalendar("office365")}
        >
          <div className="flex items-center gap-2">
            <Image className="w-4" src="/images/office-365-logo.svg" />
            Office 365
          </div>
        </DropdownItem>
        <DropdownItem key="yahoo" onPress={handleAddToCalendar("yahoo")}>
          <div className="flex items-center gap-2">
            <Image className="w-4" src="/images/yahoo-logo.webp" />
            Yahoo
          </div>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
