import { deleteTodoSchema } from "@ethang/schemas/src/dashboard/todo-schema.ts";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const deleteTodo = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "delete from todos where id = ? and userId = ?",
      )
        .bind(body.id, userId)
        .first();
    },
    request,
    requestSchema: deleteTodoSchema,
  });
};
