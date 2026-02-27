import { defineField, defineType } from "sanity";

export const blogType = defineType({
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "slug",
      options: {
        maxLength: 96,
        source: "title",
      },
      title: "Slug",
      type: "slug",
      validation: (rule) => rule.required(),
    }),
    defineField({
      initialValue: "Ethan Glover",
      name: "author",
      title: "Author",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      fields: [
        defineField({
          name: "alt",
          title: "Image Description",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
      ],
      name: "featuredImage",
      options: { hotspot: true },
      title: "Featured Image",
      type: "image",
    }),
    defineField({
      name: "blogCategory",
      title: "Category",
      to: { type: "blogCategory" },
      type: "reference",
    }),
    {
      initialValue: new Date().toISOString(),
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
    },
    {
      name: "body",
      title: "Body",
      type: "blockContent",
    },
  ],
  name: "blog",
  title: "Blog",
  type: "document",
});
