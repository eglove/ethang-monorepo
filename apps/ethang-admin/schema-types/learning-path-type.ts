import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

export const learningPathType = defineType({
  fields: [
    defineField({
      name: "name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "url",
      type: "url",
    }),
    defineField({
      name: "swebokFocus",
      options: {
        list: [
          { title: "Software Construction", value: "construction" },
          { title: "Software Testing", value: "testing" },
          { title: "Software Design", value: "design" },
          { title: "Computing Foundations", value: "computing" },
          { title: "Mathematical Foundations", value: "mathematical" },
          { title: "Engineering Foundations", value: "engineering" },
          { title: "Software Requirements", value: "requirements" },
          { title: "Software Architecture", value: "architecture" },
          { title: "Software Configuration Management", value: "scm" },
          {
            title: "Software Engineering Operations",
            value: "engineering-operations",
          },
          { title: "Software Maintenance", value: "maintenance" },
          { title: "Software Quality", value: "quality" },
          { title: "Software Security", value: "security" },
          {
            title: "Software Engineering Models and Methods",
            value: "models-methods",
          },
          { title: "Software Engineering Process", value: "process" },
          { title: "Software Engineering Management", value: "management" },
          { title: "Software Engineering Economics", value: "economics" },
          {
            title: "Software Engineering Professional Practice",
            value: "professional-practice",
          },
          { title: "Certification", value: "certification" },
        ],
      },
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "courses",
      of: [{ to: [{ type: "course" }], type: "reference" }],
      type: "array",
    }),
    orderRankField({ type: "order" }),
  ],
  name: "learningPath",
  orderings: [orderRankOrdering],
  title: "Learning Path",
  type: "document",
});
