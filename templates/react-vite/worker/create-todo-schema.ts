import { DateTime } from "luxon";
import { z } from "zod";

export const createTodoSchema = z.object({
  due: z.string().transform((value) => {
    return DateTime.fromJSDate(new Date(value)).toISO() ?? "";
  }),
  name: z.string().min(1),
});

export const deleteTodoSchema = z.object({
  id: z.string(),
});
