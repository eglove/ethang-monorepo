import { DateTime } from "luxon";
import { z } from "zod";

export const createTodoSchema = z.object({
  due: z
    .string()
    .datetime()
    .transform((value) => {
      return DateTime.fromJSDate(new Date(value)).toISO() ?? "";
    }),
  name: z.string(),
});
