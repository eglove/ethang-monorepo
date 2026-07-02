import { Effect, Schema } from "effect";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil.js";
import replace from "lodash/replace.js";

export type ParseUrlParameters<Url> =
  Url extends `${infer Path}(${infer OptionalPath})`
    ? ParseUrlParameters<Path> & Partial<ParseUrlParameters<OptionalPath>>
    : Url extends `${infer Start}/${infer Rest}`
      ? ParseUrlParameters<Rest> & ParseUrlParameters<Start>
      : Url extends `:${infer Parameter}`
        ? Record<Parameter, string>
        : NonNullable<unknown>;

export const createUrlPath = <T extends string>(
  path: T,
  parameters: ParseUrlParameters<T>,
  parametersSchema?: Schema.Schema.AnyNoContext
): Effect.Effect<string, Error> => {
  return Effect.gen(function* () {
    if (!isEmpty(parameters) && isNil(parametersSchema)) {
      return yield* Effect.fail(
        new Error("must provide path variables schema")
      );
    }

    if (!isNil(parametersSchema)) {
      yield* Effect.try({
        catch: () => {
          return new Error("Validation failed");
        },
        try: () => {
          Schema.decodeUnknownSync(parametersSchema)(parameters);
        }
      });
    }

    let url: string = path;
    for (const [key, value] of Object.entries(parameters)) {
      if (!isNil(value)) {
        url = replace(url, `:${key}`, value);
      }
    }

    return url.replaceAll(/(?<group>\(|\)|\/?:[^/]+)/gu, "");
  });
};
