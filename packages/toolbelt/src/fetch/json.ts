import type { z, ZodError, ZodObject } from "zod";

import isError from "lodash/isError.js";

import { attemptAsync } from "../functional/attempt-async.js";

export const parseFetchJson = async <Z extends ZodObject>(
  value: Request | Response,
  schema: Z,
): Promise<Error | z.output<Z> | ZodError<Z>> => {
  const unparsed = await attemptAsync(async () => {
    return value.json();
  });

  if (isError(unparsed)) {
    return unparsed;
  }

  const parsed = schema.safeParse(unparsed);

  if (!parsed.success) {
    return parsed.error;
  }

  return parsed.data;
};
