import { defineField, defineType } from "sanity";

export const job = defineType({
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
      name: "company",
      title: "Company",
      type: "string",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "startDate",
      title: "Start Date",
      type: "date",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "endDate",
      title: "End Date",
      type: "date",
      validation: (rule) => {
        return rule.min(rule.valueOfField("startDate"));
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
      name: "techUsed",
      of: [{
        to: [{ type: "technology" }],
        type: "reference",
      }],
      title: "Tech Used",
      type: "array",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "methodologiesUsed",
      of: [{
        to: [{ type: "methodology" }],
        type: "reference",
      }],
      title: "Methodologies Used",
      type: "array",
      validation: (rule) => {
        return rule.required();
      },
    }),
  ],
  name: "job",
  preview: {
    select: {
      subtitle: "title",
      title: "company",
    },
  },
  title: "Job",
  type: "document",
});
