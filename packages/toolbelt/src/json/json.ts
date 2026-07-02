import { Schema } from "effect";
import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";

export const parseJson = <Z extends Schema.Schema.AnyNoContext>(
  text: string,
  validator: Z,
  reviver?: (this: unknown, key: string, value: unknown) => unknown
): Error | Schema.Schema.Type<Z> => {
  const caught = attempt(JSON.parse, text, reviver);

  if (isError(caught)) {
    return caught;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    return Schema.decodeUnknownSync(validator)(caught) as Schema.Schema.Type<Z>;
  } catch {
    return new Error("Validation failed");
  }
};
