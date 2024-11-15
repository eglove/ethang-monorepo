import { DocumentPdfIcon } from "@sanity/icons";
import { defineType, type Rule } from "sanity";

export default defineType({
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
    {
      name: "category",
      options: {
        list: ["Covenant", "General", "Meeting Minute"],
      },
      title: "Category",
      type: "string",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
    {
      initialValue(): { date: Date } {
        return {
          date: new Date(),
        };
      },
      name: "date",
      title: "Date",
      type: "date",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
    {
      name: "file",
      title: "File",
      type: "fileUpload",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
  ],
  icon: DocumentPdfIcon,
  name: "documentUpload",
  title: "Document",
  type: "document",
});
