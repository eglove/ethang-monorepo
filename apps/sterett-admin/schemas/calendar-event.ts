import { CalendarIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { eventFields } from "./event-fields";

export default defineType({
  fields: eventFields,
  icon: CalendarIcon,
  name: "calendarEvent",
  title: "Calendar Event",
  type: "document",
});
