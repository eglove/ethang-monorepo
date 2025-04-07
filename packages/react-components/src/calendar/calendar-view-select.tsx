import { useIsMobile } from "@ethang/hooks/use-is-mobile";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Select, SelectItem } from "@heroui/select";
import entries from "lodash/entries.js";
import get from "lodash/get.js";
import map from "lodash/map";
import { EllipsisIcon } from "lucide-react";

import type { CalendarView } from "./calendar-types.ts";

import {
  calendarStore,
  handleScroll,
  handleSetView,
  useCalendarStore,
} from "./calendar-store.ts";

export const CalendarViewSelect = () => {
  const calendarStoreSubscription = useCalendarStore();
  const { isMobile } = useIsMobile(640);

  const viewDropdowns: { label: string; value: CalendarView }[] = isMobile
    ? [
        { label: "Day View", value: "day" },
        { label: "Month View", value: "month" },
        { label: "Year View", value: "year" },
      ]
    : [
        { label: "Day View", value: "day" },
        { label: "Week View", value: "week" },
        { label: "Month View", value: "month" },
        { label: "Year View", value: "year" },
      ];

  return (
    <>
      <div className="hidden md:ml-4 md:flex min-w-32">
        <Select
          onSelectionChange={(value) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const selectedValue = get(
              entries(value),
              [0, 0],
              "week",
            ) as CalendarView;

            calendarStore.set((state) => {
              state.selectedView = selectedValue;
            });
          }}
          aria-label="Select View"
          placeholder="Select View"
          selectedKeys={[calendarStoreSubscription.selectedView]}
          variant="bordered"
        >
          {map(viewDropdowns, (view) => {
            return <SelectItem key={view.value}>{view.label}</SelectItem>;
          })}
        </Select>
      </div>
      <div className="relative ml-6 md:hidden">
        <Dropdown>
          <DropdownTrigger>
            <Button isIconOnly aria-label="More Options" variant="bordered">
              <EllipsisIcon />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Options">
            <DropdownSection showDivider>
              <DropdownItem key="today" onPress={handleScroll("today")}>
                Go to Today
              </DropdownItem>
            </DropdownSection>
            <DropdownSection>
              {map(viewDropdowns, (view) => {
                return (
                  <DropdownItem
                    key={view.value}
                    onPress={handleSetView(view.value)}
                  >
                    {view.label}
                  </DropdownItem>
                );
              })}
            </DropdownSection>
          </DropdownMenu>
        </Dropdown>
      </div>
    </>
  );
};
