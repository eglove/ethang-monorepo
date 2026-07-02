import { Schema } from "effect";
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
): Error | string => {
  if (!isEmpty(parameters) && isNil(parametersSchema)) {
    return new Error("must provide path variables schema");
  }

  if (!isNil(parametersSchema)) {
    try {
      Schema.decodeUnknownSync(parametersSchema)(parameters);
    } catch {
      return new Error("Validation failed");
    }
  }

  let url: string = path;
  for (const [key, value] of Object.entries(parameters)) {
    if (!isNil(value)) {
      url = replace(url, `:${key}`, value);
    }
  }

  return url.replaceAll(/(?<group>\(|\)|\/?:[^/]+)/gu, "");
};
