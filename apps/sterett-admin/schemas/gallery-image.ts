import { ImageIcon } from "@sanity/icons/Image";
import { defineType, type Rule } from "sanity";

export default defineType({
  fields: [
    {
      name: "description",
      title:
        "Description (This is read by screen readers for visually impaired people.)",
      type: "string",
      validation: (rule: Rule) => {
        return rule.required();
      }
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      validation: (rule: Rule) => {
        return rule.required();
      }
    }
  ],
  icon: ImageIcon,
  name: "galleryImage",
  title: "Gallery Image",
  type: "document"
});
