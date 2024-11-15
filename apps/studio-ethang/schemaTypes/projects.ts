import { defineField, defineType } from "sanity";

export const projects = defineType({
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
    defineField({
      name: "description",
      title: "Description",
      type: "blockContent",
      validation: (rule) => {
        return rule.required();
      },
    }),
  ],
  name: "projects",
  title: "Projects",
  type: "document",
});
