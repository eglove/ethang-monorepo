import { defineField, defineType } from "sanity";

export const blogCategoryType = defineType({
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  name: "blogCategory",
  title: "Blog Category",
  type: "object",
});
