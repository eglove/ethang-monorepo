import { defineType } from "sanity";

export const imageUpload = defineType({
  fields: [
    {
      name: "alt",
      title: "Alt Text",
      type: "string",
      validation: (rule) => {
        return rule.required();
      },
    },
    {
      name: "tags",
      of: [{ type: "string" }],
      title: "Tags",
      type: "array",
    },
    {
      name: "imageUpload",
      options: {
        hotspot: true,
      },
      title: "Image",
      type: "image",
      validation: (rule) => {
        return rule.required();
      },
    },
  ],
  name: "imageUpload",
  title: "Image",
  type: "document",
});
