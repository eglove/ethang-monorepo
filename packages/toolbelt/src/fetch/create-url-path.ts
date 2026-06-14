import type { ZodError, ZodObject } from "zod";

import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import isFunction from "lodash/isFunction.js";
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
  parametersSchema?: ZodObject
): Error | string | ZodError => {
  let url: string = path;

  if (!isEmpty(parameters) && isNil(parametersSchema)) {
    return new Error("must provide path variables schema");
  }

  if (!isNil(parametersSchema)) {
    const safeParse = get(parametersSchema, "safeParse");
    if (!isFunction(safeParse)) {
      return new Error("must provide a valid zod schema");
    }

    const result = parametersSchema.safeParse(parameters);

    if (!result.success) {
      return result.error;
    }
  }

  for (const [key, value] of Object.entries(parameters)) {
    if (!isNil(value)) {
      url = replace(url, `:${key}`, value);
    }
  }

  return url.replaceAll(/(?<group>\(|\)|\/?:[^/]+)/gu, "");
};
