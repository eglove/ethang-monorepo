import { UserIcon } from "@sanity/icons";
import {
  orderRankField,
  orderRankOrdering,
} from "@sanity/orderable-document-list";
import { defineType, type Rule } from "sanity";

export default defineType({
  fields: [
    orderRankField({ type: "trustee" }),
    {
      name: "name",
      title: "Name",
      type: "string",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
    {
      hidden: true,
      name: "order",
      title: "Order",
      type: "number",
    },
    {
      name: "phoneNumber",
      title: "Phone Number",
      type: "string",
    },
    {
      name: "duties",
      title: "Duties",
      type: "string",
    },
    {
      name: "image",
      title: "Image",
      type: "image",
    },
  ],
  icon: UserIcon,
  name: "trustee",
  orderings: [
    orderRankOrdering,
    {
      by: [
        {
          direction: "asc",
          field: "order",
        },
      ],
      name: "order",
      title: "Order",
    },
  ],
  title: "Trustee",
  type: "document",
});
