import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { defineField, defineType } from "sanity";

export const wowTaskType = defineType({
  fields: [
    defineField({
      name: "title",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "taskType",
      options: {
        list: [
          { title: "Daily", value: "daily" },
          { title: "Weekly", value: "weekly" },
          { title: "One Time", value: "one-time" },
        ],
      },
      title: "Task Type",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      description: "e.g. Until reputation is tentative",
      name: "objective",
      type: "string",
    }),
    defineField({
      name: "requirements",
      of: [{ to: [{ type: "wowTask" }], type: "reference" }],
      type: "array",
    }),
    defineField({
      name: "notes",
      type: "text",
    }),
    orderRankField({ type: "order" }),
  ],
  name: "wowTask",
  orderings: [orderRankOrdering],
  preview: {
    prepare({ taskType, title }) {
      let typeLabel = "Daily";

      if ("weekly" === taskType) {
        typeLabel = "Weekly";
      }

      if ("one-time" === taskType) {
        typeLabel = "One Time";
      }

      return {
        title: `${typeLabel} - ${title}`,
      };
    },
    select: {
      taskType: "taskType",
      title: "title",
    },
  },
  title: "WoW Task",
  type: "document",
});
