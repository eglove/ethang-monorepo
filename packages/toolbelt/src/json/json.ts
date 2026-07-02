import { Effect, Schema } from "effect";

export const parseJson = <A>(
  text: string,
  validator: Schema.Schema<A>,
  reviver?: (this: unknown, key: string, value: unknown) => unknown
): Effect.Effect<A, Error> => {
  return Effect.gen(function* () {
    const caught = yield* Effect.try({
      catch: (error) => {
        return Error.isError(error) ? error : new Error(String(error));
      },
      try: () => {
        return JSON.parse(text, reviver);
      }
    });

    return yield* Effect.try({
      catch: () => {
        return new Error("Validation failed");
      },
      try: () => {
        return Schema.decodeUnknownSync(validator)(caught);
      }
    });
  });
};
