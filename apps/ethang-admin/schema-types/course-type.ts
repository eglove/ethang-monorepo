import { defineField, defineType } from "sanity";

import { isUrlUnique } from "../util/is-url-unique.ts";

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
      title: "URL",
      type: "url",
      validation: (rule) => isUrlUnique(rule, true, "course"),
    }),
  ],
  name: "course",
  title: "Course",
  type: "document",
});
