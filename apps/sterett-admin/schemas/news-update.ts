import { BulbOutlineIcon } from "@sanity/icons";
import { DateTime } from "luxon";
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
          date: DateTime.now().toJSDate()
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
        return Rule.custom((expireDate: string | undefined, context) => {
          if (expireDate === undefined) {
            return "Value is required";
          }

          if (context.document === undefined) {
            return true;
          }

          const INCREMENT = 1;
          const dateFieldValue = DateTime.fromISO(
            String(context.document["date"])
          ).plus({ days: INCREMENT });
          const expireDateValue = DateTime.fromISO(expireDate);

          if (expireDateValue.toMillis() < dateFieldValue.toMillis()) {
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
