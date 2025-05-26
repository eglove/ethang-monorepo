import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";
import isNotANumber from "lodash/isNaN";
import isNil from "lodash/isNil.js";
import toUpper from "lodash/toUpper";

export const getAllQuestionAnswers = async (
  request: Request,
  environment: Env,
) => {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  let page = Number(url.searchParams.get("page") ?? 1);
  let limit = Number(url.searchParams.get("limit") ?? 10);
  const search = url.searchParams.get("search");
  const sortBy = url.searchParams.get("sortBy");
  const sortOrder = url.searchParams.get("sortOrder") ?? "asc";
  const filterBy = url.searchParams.get("filterBy");
  const filterValue = url.searchParams.get("filterValue");

  if (isNotANumber(page)) {
    page = 1;
  }

  if (isNotANumber(limit)) {
    limit = 10;
  }

  if (isNil(userId)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  let query = "select * from questionAnswers where userId = ?";
  const parameters = [userId];

  if (!isNil(search)) {
    query += " and (question like ? or answer like ?)";
    parameters.push(`%${search}%`, `%${search}%`);
  }

  if (!isNil(filterBy) && !isNil(filterValue)) {
    query += ` and ${filterBy} = ?`;
    parameters.push(filterValue);
  }

  if (!isNil(sortBy)) {
    query += ` order by ${sortBy} ${toUpper(sortOrder)}`;
  }

  const offset = (page - 1) * limit;
  query += ` limit ? offset ?`;
  parameters.push(String(limit), String(offset));

  const questionAnswers = await attemptAsync(async () => {
    return environment.DB.prepare(query)
      .bind(...parameters)
      .all();
  });

  if (isError(questionAnswers)) {
    return createJsonResponse(
      { error: "Unable to get question answers" },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(questionAnswers.results, "OK");
};
