import { defineType } from "sanity";

export const videoEmbedType = defineType({
  fields: [
    { name: "videoId", title: "Video ID", type: "string" },
    {
      name: "url",
      title: "URL",
      type: "url",
    },
    { name: "title", title: "Title", type: "string" },
    {
      name: "source",
      options: {
        list: [{ title: "YouTube", value: "youtube" }],
      },
      type: "string",
    },
  ],
  name: "videoEmbed",
  title: "Video Embed",
  type: "object",
});
