import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";

export const getAllTodos = async (environment: Env, userId: string) => {
  const todos = await attemptAsync(async () =>
    environment.DB.prepare("select * from todos where userId = ?")
      .bind(userId)
      .all(),
  );

  if (isError(todos)) {
    return createJsonResponse(
      { error: "Unable to get todos" },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(todos.results, "OK");
};
