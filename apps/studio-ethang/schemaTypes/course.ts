import { defineField, defineType } from "sanity";

export const course = defineType({
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "url",
      title: "URL",
      type: "url",
      validation: (rule) => {
        return rule.required();
      },
    }),
  ],
  name: "course",
  title: "Course",
  type: "document",
});
