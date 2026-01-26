import { defineField, defineType } from "sanity";

export const courseType = defineType({
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "author",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  name: "course",
  title: "Course",
  type: "document",
});
