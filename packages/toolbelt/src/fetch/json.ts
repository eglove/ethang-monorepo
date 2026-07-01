import { Schema } from "effect";
import isError from "lodash/isError.js";

import { attemptAsync } from "../functional/attempt-async.js";

export const parseFetchJson = async <Z extends Schema.Schema.AnyNoContext>(
  value: Request | Response,
  schema: Z
): Promise<Error | Schema.Schema.Type<Z>> => {
  const unparsed = await attemptAsync(async () => {
    return value.json();
  });

  if (isError(unparsed)) {
    return unparsed;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return Schema.decodeUnknownSync(schema)(unparsed) as Schema.Schema.Type<Z>;
  } catch {
    return new Error("Validation failed");
  }
};
