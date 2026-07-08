import { Effect } from "effect";

export const attemptAsync = <A>(
  callback: () => Promise<A>
): Effect.Effect<A, Error> => {
  return Effect.tryPromise({
    catch: (error: unknown) => {
      return Error.isError(error)
        ? error
        : new Error(`${callback.name} failed`);
    },
    try: callback
  });
};
