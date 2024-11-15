import { defineField, defineType } from "sanity";

export const courseSection = defineType({
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
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
    defineField({
      name: "courses",
      of: [{
        to: [{ type: "course" }],
        type: "reference",
      }],
      title: "Courses",
      type: "array",
    }),
  ],
  name: "courseSection",
  title: "Course Section",
  type: "document",
});
