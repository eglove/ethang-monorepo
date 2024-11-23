import { BulbOutlineIcon } from "@sanity/icons";
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
      initialValue(): { date: Date } {
        return {
          date: new Date(),
        };
      },
      name: "date",
      title: "Start Showing",
      type: "date",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
    {
      name: "expireDate",
      title: "Stop Showing",
      type: "date",
      validation(Rule): Rule {
        // eslint-disable-next-line max-statements
        return Rule.custom((expireDate: string | undefined, context) => {
          if (expireDate === undefined) {
            return "Value is required";
          }

          if (context.document === undefined) {
            return true;
          }

          const INCREMENT = 1;
          const dateFieldValue = new Date(String(context.document["date"]));
          dateFieldValue.setDate(dateFieldValue.getDate() + INCREMENT);
          const expireDateValue = new Date(expireDate);

          if (expireDateValue < dateFieldValue) {
            return "Expiration date must be at least one day after the date";
          }

          return true;
        });
      },
    },
    {
      name: "description",
      title: "Description",
      type: "blockContent",
      validation(rule: Rule): Rule {
        return rule.required();
      },
    },
  ],
  icon: BulbOutlineIcon,
  name: "newsUpdate",
  title: "News Update",
  type: "document",
});
