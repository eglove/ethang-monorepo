import { defineField, defineType } from "sanity";

export const newsType = defineType({
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "youtubeVideoId",
      type: "string",
    }),
    defineField({
      name: "url",
      type: "url",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "published",
      type: "date",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "quote",
      type: "string",
      validation: (rule) => {
        return rule.required();
      },
    }),
  ],
  name: "news",
  title: "News",
  type: "document",
});
