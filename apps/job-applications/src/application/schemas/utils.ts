import { Effect, ParseResult, Schema } from "effect";

import { ValidationError } from "../../errors/validation-error.ts";

export const decodeInput = <I, A>(
  schema: Schema.Schema<A, I>,
  input: unknown
) => {
  return Effect.mapError(Schema.decodeUnknown(schema)(input), (cause) => {
    return new ValidationError(
      ParseResult.TreeFormatter.formatErrorSync(cause)
    );
  });
};
