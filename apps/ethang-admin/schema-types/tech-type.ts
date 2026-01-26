import { defineField, defineType } from "sanity";

export const techType = defineType({
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  name: "tech",
  title: "Tech",
  type: "document",
});
