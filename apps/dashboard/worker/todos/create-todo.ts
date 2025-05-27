import { createTodoSchema } from "@ethang/schemas/src/dashboard/todo-schema.ts";
import { v7 } from "uuid";

import { queryOnBody } from "../utilities/query-on-body.ts";

export const createTodo = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  return queryOnBody({
    dbFunction: async (body) => {
      return environment.DB.prepare(
        "insert into todos (id, userId, title, description, recurs, dueDate) values (?, ?, ?, ?, ?, ?)",
      )
        .bind(
          v7(),
          userId,
          body.title,
          body.description,
          body.recurs,
          body.dueDate,
        )
        .first();
    },
    request,
    requestSchema: createTodoSchema,
  });
};
