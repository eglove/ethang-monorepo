import { todoSchema } from "@ethang/schemas/src/dashboard/todo-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const updateTodo = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "update todos set title = ?, description = ?, recurs = ?, dueDate = ? where id = ? and userId = ?",
      )
        .bind(
          body.title,
          body.description,
          body.recurs,
          body.dueDate,
          body.id,
          userId,
        )
        .first();
    },
    request,
    requestSchema: todoSchema,
  });
};
