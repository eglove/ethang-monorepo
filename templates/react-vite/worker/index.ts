import { HTTP_STATUS } from "@ethang/toolbelt/constants/http";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError.js";
import startsWith from "lodash/startsWith.js";
import { v7 } from "uuid";

import { createTodoSchema, deleteTodoSchema } from "./create-todo-schema.ts";
import { getTodoModel } from "./database.ts";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);
    const todos = getTodoModel(environment);

    const isTodo = startsWith(url.pathname, "/api/todo");

    if (isTodo && "POST" === request.method) {
      const data = await parseFetchJson(request, createTodoSchema);

      if (isError(data)) {
        return Response.json(
          { error: "Invalid Request" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const todo = await attemptAsync(async () => {
        return todos.InsertOne({
          ...data,
          id: v7(),
        });
      });

      if (isError(data)) {
        return Response.json(
          { error: "Failed to create todo" },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }

      return Response.json({ data: todo });
    }

    if (isTodo && "DELETE" === request.method) {
      const data = await parseFetchJson(request, deleteTodoSchema);

      if (isError(data)) {
        return Response.json(
          { error: "Invalid Request" },
          { status: HTTP_STATUS.BAD_REQUEST },
        );
      }

      const result = await attemptAsync(async () => {
        return todos.Delete({ where: { id: data.id } });
      });

      if (isError(data)) {
        return Response.json(
          { error: "Failed to create todo" },
          { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
        );
      }

      return Response.json({ data: result });
    }

    if (isTodo && "GET" === request.method) {
      const data = await todos.All({ orderBy: "id" });
      return Response.json({ data: data.results });
    }

    return new Response(null, { status: 404 });
  },
  // eslint-disable-next-line sonar/no-reference-error
} satisfies ExportedHandler<Env>;
