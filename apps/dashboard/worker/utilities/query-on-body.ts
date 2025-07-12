import type { z, ZodObject } from "zod";

import { createJsonResponse } from "@ethang/toolbelt/fetch/create-json-response";
import { parseFetchJson } from "@ethang/toolbelt/fetch/json";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async";
import isError from "lodash/isError";

type QueryProperties<Z extends ZodObject, R> = {
  dbFunction: (body: z.output<Z>) => Promise<R>;
  request: Request;
  requestSchema: Z;
};

export const queryOnBody = async <Z extends ZodObject, R>({
  dbFunction,
  request,
  requestSchema,
}: QueryProperties<Z, R>) => {
  // @ts-expect-error not using old types
  const body = await parseFetchJson(request, requestSchema);

  if (isError(body)) {
    return createJsonResponse({ error: "Invalid request" }, "BAD_REQUEST");
  }

  const result = await attemptAsync(async () => {
    return dbFunction(body);
  });

  if (isError(result)) {
    return createJsonResponse(
      { error: result.message },
      "INTERNAL_SERVER_ERROR",
    );
  }

  return createJsonResponse(result, "OK");
};
