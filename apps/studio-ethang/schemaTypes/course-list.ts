import { defineField, defineType } from "sanity";

export const courseList = defineType({
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
      name: "courseSections",
      of: [{
        to: [{ type: "courseSection" }],
        type: "reference",
      }],
      title: "Course Sections",
      type: "array",
    }),
  ],
  name: "courseList",
  title: "Course List",
  type: "document",
});
