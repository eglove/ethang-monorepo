import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString";
import map from "lodash/map.js";
import toUpper from "lodash/toUpper";

import { getUrlFilters } from "../utilities/get-url-filters.ts";

export const getAllApplications = async (
  request: Request,
  environment: Env,
  userId: string,
) => {
  const { filterBy, filterValue, limit, page, search, sortBy, sortOrder } =
    getUrlFilters(request.url);

  let query = "select * from applications where userId = ?";
  const parameters = [userId];

  if (!isNil(search)) {
    query += " and (company like ? or title like ?)";
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

  const applications = await attemptAsync(async () => {
    return environment.DB.prepare(query)
      .bind(...parameters)
      .all();
  });

  if (isError(applications)) {
    return createJsonResponse(
      { error: "Unable to get applications" },
      "INTERNAL_SERVER_ERROR",
    );
  }

  const converted = map(applications.results, (application) => {
    return {
      ...application,
      // @ts-expect-error ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      interviewRounds: isString(application.interviewRounds)
        ? // @ts-expect-error ignore
          JSON.parse(application.interviewRounds)
        : [],
    };
  });

  return createJsonResponse(converted, "OK");
};
