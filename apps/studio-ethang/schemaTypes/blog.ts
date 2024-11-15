import replace from "lodash/replace.js";
import toLower from "lodash/toLower.js";
import { defineField, defineType } from "sanity";

export const blog = defineType({
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
      name: "slug",
      options: {
        maxLength: 200,
        slugify: (input) => {
          return replace(toLower(input), /\s+/gu, "-")
            .slice(0, 200);
        },
        source: "title",
      },
      title: "Slug",
      type: "slug",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "publishedAt",
      title: "Published At",
      type: "datetime",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "updatedAt",
      title: "Updated At",
      type: "datetime",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "string",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "tags",
      of: [{ type: "string" }],
      title: "Tags",
      type: "array",
    }),
    defineField({
      name: "featuredImage",
      title: "Featured Image",
      to: [{ type: "imageUpload" }],
      type: "reference",
      validation: (rule) => {
        return rule.required();
      },
    }),
    defineField({
      name: "blog",
      title: "Block",
      type: "blockContent",
      validation: (rule) => {
        return rule.required();
      },
    }),
  ],
  name: "blog",
  title: "Blog",
  type: "document",
});
