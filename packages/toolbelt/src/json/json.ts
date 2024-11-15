import type { z } from "zod";

import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";

import type { ZodValidator } from "../types/zod-validator.ts";

export const parseJson = <Z extends ZodValidator<Z>,>(
  text: string,
  validator: Z,
  reviver?: (this: unknown, key: string, value: unknown) => unknown,
): Error | z.output<Z> | z.ZodError<Z> => {
  const caught = attempt(JSON.parse, text, reviver);

  if (isError(caught)) {
    return caught;
  }

  const unparsed = validator.safeParse(caught);

  return unparsed.success
    ? unparsed.data
    : unparsed.error;
};
