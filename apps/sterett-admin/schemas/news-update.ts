import { BulbOutlineIcon } from "@sanity/icons/BulbOutline";
import { DateTime } from "effect";
import isNil from "lodash/isNil.js";
import { defineType, type Rule } from "sanity";

export default defineType({
  fields: [
    {
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule: Rule): Rule => {
        return rule.required();
      }
    },
    {
      initialValue: (): { date: Date } => {
        return {
          date: DateTime.toDateUtc(DateTime.unsafeNow())
        };
      },
      name: "date",
      title: "Start Showing",
      type: "date",
      validation: (rule: Rule): Rule => {
        return rule.required();
      }
    },
    {
      name: "expireDate",
      title: "Stop Showing",
      type: "date",
      validation: (Rule): Rule => {
        return Rule.custom((expireDate, context) => {
          if (isNil(expireDate)) {
            return "Value is required";
          }

          if (isNil(context.document)) {
            return true;
          }

          const INCREMENT = 1;
          const dateFieldValue = DateTime.toDateUtc(
            DateTime.unsafeMake(String(context.document["date"]))
          );
          dateFieldValue.setDate(dateFieldValue.getDate() + INCREMENT);
          const expireDateValue = DateTime.toDateUtc(
            DateTime.unsafeMake(expireDate)
          );

          if (expireDateValue.getTime() < dateFieldValue.getTime()) {
            return "Expiration date must be at least one day after the date";
          }

          return true;
        });
      }
    },
    {
      name: "description",
      title: "Description",
      type: "blockContent",
      validation: (rule: Rule): Rule => {
        return rule.required();
      }
    }
  ],
  icon: BulbOutlineIcon,
  name: "newsUpdate",
  title: "News Update",
  type: "document"
});
