import { ActivityIcon } from "@sanity/icons";
import { defineType } from "sanity";

import { eventFields } from "./event-fields";

export default defineType({
  fields: eventFields,
  icon: ActivityIcon,
  name: "beyonderEvent",
  title: "Beyonder Event",
  type: "document"
});
