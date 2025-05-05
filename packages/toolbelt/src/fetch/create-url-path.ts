import type { ZodError, ZodSchema } from "zod";

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
  parametersSchema?: ZodSchema,
): Error | string | ZodError<typeof parametersSchema> => {
  let url = path;

  if (!isEmpty(parameters) && isNil(parametersSchema)) {
    return new Error("must provide path variables schema");
  }

  if (!isNil(parametersSchema)) {
    const result = parametersSchema.safeParse(parameters);

    if (!result.success) {
      return result.error;
    }
  }

  for (const [key, value] of Object.entries<string>(parameters)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    url = replace(path, `:${key}`, value) as T;
  }

  return url.replaceAll(/(?<group>\(|\)|\/?:[^/]+)/gu, "");
};
