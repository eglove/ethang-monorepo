import { defineField, defineType } from "sanity";

export const projectType = defineType({
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "publicUrl",
      type: "url",
    }),
    defineField({
      name: "githubUrl",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "techs",
      of: [
        {
          to: [{ type: "tech" }],
          type: "reference",
        },
      ],
      type: "array",
    }),
    defineField({
      name: "description",
      of: [{ type: "block" }],
      type: "array",
      validation: (rule) => rule.required(),
    }),
  ],
  name: "project",
  title: "Project",
  type: "document",
});
