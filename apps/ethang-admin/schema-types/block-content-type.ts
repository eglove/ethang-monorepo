import { defineField, defineType } from "sanity";

export const blockContentType = defineType({
  name: "blockContent",
  of: [
    {
      lists: [{ title: "Bullet", value: "bullet" }],
      marks: {
        annotations: [
          {
            fields: [
              defineField({
                name: "href",
                title: "URL",
                type: "url",
              }),
            ],
            name: "link",
            title: "URL",
            type: "object",
          },
        ],
        decorators: [
          { title: "Strong", value: "strong" },
          { title: "Emphasis", value: "em" },
        ],
      },
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H1", value: "h1" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "Quote", value: "blockquote" },
      ],
      title: "Block",
      type: "block",
    },
    {
      fields: [
        defineField({
          name: "alt",
          title: "Image Description",
          type: "string",
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: "caption",
          title: "Caption",
          type: "string",
        }),
      ],
      options: { hotspot: true },
      type: "image",
    },
    defineField({
      name: "quote",
      title: "Quote",
      type: "blockquote",
    }),
    defineField({
      name: "code",
      title: "Code",
      type: "code",
    }),
    defineField({
      name: "video",
      title: "Video",
      type: "videoEmbed",
    }),
  ],
  title: "Block Content",
  type: "array",
});
