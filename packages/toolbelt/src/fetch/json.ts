import { Effect, Schema } from "effect";

import { attemptAsync } from "../functional/attempt-async.js";

export const parseFetchJson = <A>(
  value: Request | Response,
  schema: Schema.Schema<A>
): Effect.Effect<A, Error> => {
  return Effect.gen(function* () {
    const unparsed = yield* attemptAsync(async () => {
      return value.json();
    });
    return yield* Effect.try({
      catch: () => {
        return new Error("Validation failed");
      },
      try: () => {
        return Schema.decodeUnknownSync(schema)(unparsed);
      }
    });
  });
};
