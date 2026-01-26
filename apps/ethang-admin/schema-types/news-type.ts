import { defineField, defineType } from "sanity";

export const newsType = defineType({
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "youtubeVideoId",
      type: "string",
    }),
    defineField({
      name: "url",
      type: "url",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "published",
      type: "date",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "quote",
      type: "string",
      validation: (rule) => rule.required(),
    }),
  ],
  name: "news",
  title: "News",
  type: "document",
});
