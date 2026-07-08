import { Effect, Schema } from "effect";

export const parseFetchJson = <A>(
  value: Request | Response,
  schema: Schema.Schema<A>
): Effect.Effect<A, Error> => {
  return Effect.gen(function* () {
    const unparsed = yield* Effect.tryPromise({
      catch: (error: unknown) => {
        return Error.isError(error) ? error : new Error(String(error));
      },
      try: async () => {
        return value.json();
      }
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
