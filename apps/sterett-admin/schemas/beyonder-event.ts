import { ActivityIcon } from "@sanity/icons";
import { defineType, type Rule } from "sanity";

export default defineType({
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
    {
      name: "startsAt",
      title: "Starts At",
      type: "datetime",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
    {
      name: "endsAt",
      title: "Ends At",
      type: "datetime",
      validation(rule: Rule): Rule {
        return rule.min(rule.valueOfField("startsAt"));
      },
    },
    {
      name: "description",
      title: "Description",
      type: "blockContent",
    },
  ],
  icon: ActivityIcon,
  name: "beyonderEvent",
  title: "Beyonder Event",
  type: "document",
});
