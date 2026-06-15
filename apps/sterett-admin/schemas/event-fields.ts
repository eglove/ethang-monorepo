import type { Rule } from "sanity";

export const eventFields = [
  {
    name: "title",
    title: "Title",
    type: "string",
    validation: (rule: Rule): Rule => {
      return rule.required();
    }
  },
  {
    name: "startsAt",
    title: "Starts At",
    type: "datetime",
    validation: (rule: Rule): Rule => {
      return rule.required();
    }
  },
  {
    name: "endsAt",
    title: "Ends At",
    type: "datetime",
    validation: (rule: Rule): Rule => {
      return rule.min(rule.valueOfField("startsAt"));
    }
  },
  {
    name: "description",
    title: "Description",
    type: "blockContent"
  }
];
