import type { ZodError, ZodSchema } from "zod";

import attempt from "lodash/attempt.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { createSearchParameters } from "./create-search-parameters.ts";
import { createUrlPath, type ParseUrlParameters } from "./create-url-path.ts";

export type PathVariablesRecord = Record<string, number | string>;
export type SearchParametersRecord = Record<
  string,
    number | number[] | string | string[] | undefined
>;

export type UrlConfig<Url extends string,> = {
  pathVariables?: ParseUrlParameters<Url>;
  pathVariablesSchema?: ZodSchema;
  searchParams?: SearchParametersRecord;
  searchParamsSchema?: ZodSchema;
  urlBase?: string | URL;
};

export const createUrl = <Url extends string,>(
  urlString: Url,
  config?: UrlConfig<Url>,
// eslint-disable-next-line sonar/cognitive-complexity
): Error | URL | ZodError => {
  if (
    !isNil(config) &&
    !isNil(config.pathVariables) &&
    isNil(config.pathVariablesSchema)
  ) {
    return new Error("must provide path variables schema");
  }

  let mutableUrlString = urlString;

  if (!isNil(config) && !isNil(config.pathVariables)) {
    const path = createUrlPath(
      urlString,
      config.pathVariables,
      config.pathVariablesSchema,
    );

    if (isError(path)) {
      return path;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    mutableUrlString = path as Url;
  }

  const url = attempt(() => {
    return new URL(mutableUrlString,
      config?.urlBase);
  });

  if (isError(url)) {
    return url;
  }

  if (
    !isNil(config) &&
    !isNil(config.searchParams) &&
    isNil(config.searchParamsSchema)
  ) {
    return new Error("must provide search parameters schema");
  }

  if (
    !isNil(config) &&
    !isNil(config.searchParams) &&
    !isNil(config.searchParamsSchema)
  ) {
    const parameters = createSearchParameters(
      config.searchParams,
      config.searchParamsSchema,
    );

    if (isError(parameters)) {
      return parameters;
    }

    if (!isNil(parameters)) {
      for (const [
        key,
        value,
      ] of parameters.entries()) {
        url.searchParams.append(key,
          value);
      }
    }
  }

  return url;
};
