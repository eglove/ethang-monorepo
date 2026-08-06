import { DateTime } from "effect";

/**
Formats a UTC datetime string into a human-friendly representation. Exported
so unit tests can exercise the format helper directly.
*/
export const formattedDateTime = (dateTime: string) => {
  return DateTime.format(DateTime.unsafeMake(dateTime), {
    dateStyle: "medium",
    timeStyle: "short"
  });
};
