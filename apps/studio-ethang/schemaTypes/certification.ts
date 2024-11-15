import { defineField, defineType } from "sanity";

export const certification = defineType({
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
      name: "issuedBy",
      title: "Issued By",
      type: "string",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "issuedOn",
      title: "Issued On",
      type: "date",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "expires",
      title: "Expires",
      type: "date",
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
  name: "certification",
  title: "Certification",
  type: "document",
});
