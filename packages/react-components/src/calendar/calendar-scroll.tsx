import { Button } from "@heroui/button";
import { ChevronLeftIcon, ChevronRight } from "lucide-react";

import { handleScroll } from "./calendar-store.ts";

export const CalendarScroll = () => {
  return (
    <div className="flex bg-white">
      <Button
        isIconOnly
        aria-label="Previous month"
        className="rounded-r-none border-r-0"
        onPress={handleScroll("previous")}
        type="button"
        variant="bordered"
      >
        <ChevronLeftIcon aria-hidden="true" className="size-5" />
      </Button>
      <Button
        className="rounded-none"
        onPress={handleScroll("today")}
        type="button"
        variant="bordered"
      >
        Today
      </Button>
      <Button
        isIconOnly
        aria-label="Next month"
        className="rounded-l-none border-l-0"
        onPress={handleScroll("next")}
        type="button"
        variant="bordered"
      >
        <ChevronRight aria-hidden="true" className="size-5" />
      </Button>
    </div>
  );
};
