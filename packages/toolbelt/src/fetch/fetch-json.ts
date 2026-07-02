import { Effect, type Schema } from "effect";

import { parseFetchJson } from "./json.ts";

export const fetchJson = <A>(
  input: Request | string | URL,
  schema: Schema.Schema<A>,
  init?: RequestInit
): Effect.Effect<A, Error> => {
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({
      catch: (error) => {
        return Error.isError(error) ? error : new Error(String(error));
      },
      try: async () => {
        return globalThis.fetch(input, init);
      }
    });
    return yield* parseFetchJson(response, schema);
  });
};
