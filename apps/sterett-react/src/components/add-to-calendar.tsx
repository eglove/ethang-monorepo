import type { PortableTextBlock } from "@portabletext/types";

import { Button } from "@nextui-org/button";
import { Image } from "@nextui-org/image";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";
import { toPlainText } from "@portabletext/react";
import { type CalendarEvent, google, ics, office365, outlook, yahoo } from "calendar-link";
import isNil from "lodash/isNil";
import { useCallback } from "react";

import { openNewTab } from "../util/url.ts";

type AddToCalendarProperties = {
  readonly buttonProps?: Parameters<typeof Button>[0];
  readonly description?: PortableTextBlock;
} & Readonly<Omit<CalendarEvent, "description">>;

export const AddToCalendar = ({
  buttonProps,
  description,
  ...rest
}: AddToCalendarProperties) => {
  const handlePress = useCallback(
    (type: "google" | "ics" | "office365" | "outlook" | "yahoo") => {
      const data = {
        ...rest,
        description: isNil(description)
          ? ""
          : toPlainText(description),
      };

      // eslint-disable-next-line max-statements
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
    },
    [description, rest],
  );

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button {...buttonProps}>
          Add To Calendar
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Calendar Options"
        selectionMode="single"
      >
        <DropdownItem
          key="ics"
          onPress={handlePress("ics")}
        >
          <div className="flex items-center gap-2">
            <Image
              className="w-4"
              src="/images/apple-logo.png"
            />
            Apple / ICS
          </div>
        </DropdownItem>
        <DropdownItem
          key="google"
          onPress={handlePress("google")}
        >
          <div className="flex items-center gap-2">
            <Image
              className="w-4"
              src="/images/google-logo.png"
            />
            Google
          </div>
        </DropdownItem>
        <DropdownItem
          key="outlook"
          onPress={handlePress("outlook")}
        >
          <div className="flex items-center gap-2">
            <Image
              className="w-4"
              src="/images/outlook-logo.png"
            />
            Outlook
          </div>
        </DropdownItem>
        <DropdownItem
          key="office365"
          onPress={handlePress("office365")}
        >
          <div className="flex items-center gap-2">
            <Image
              className="w-4"
              src="/images/office-365-logo.svg"
            />
            Office 365
          </div>
        </DropdownItem>
        <DropdownItem
          key="yahoo"
          onPress={handlePress("yahoo")}
        >
          <div className="flex items-center gap-2">
            <Image
              className="w-4"
              src="/images/yahoo-logo.webp"
            />
            Yahoo
          </div>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};
