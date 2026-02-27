import { defineField, defineType } from "sanity";

export const blockquoteType = defineType({
  fields: [
    defineField({
      name: "sourceUrl",
      title: "Source URL",
      type: "url",
    }),
    defineField({
      name: "source",
      title: "Source",
      type: "string",
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "string",
    }),
    defineField({
      name: "quote",
      title: "Quote",
      type: "text",
    }),
  ],
  name: "blockquote",
  title: "Blockquote",
  type: "object",
});
