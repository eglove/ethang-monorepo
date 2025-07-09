import type { ZodError, ZodObject } from "zod";

import attempt from "lodash/attempt.js";
import get from "lodash/get.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

import { appendSearchParameters } from "../url/append-search-parameters.js";
import { createSearchParameters } from "./create-search-parameters.ts";
import { createUrlPath, type ParseUrlParameters } from "./create-url-path.ts";

export type PathVariablesRecord = Record<string, number | string>;
export type SearchParametersRecord = Record<
  string,
  number | number[] | string | string[] | undefined
>;

export type UrlConfig<Url extends string> = {
  pathVariables?: ParseUrlParameters<Url>;
  pathVariablesSchema?: ZodObject;
  searchParams?: SearchParametersRecord;
  searchParamsSchema?: ZodObject;
  urlBase?: string | URL;
};

const hasValidationError = <Url extends string>(
  parameterKey: keyof UrlConfig<Url>,
  schemaKey: keyof UrlConfig<Url>,
  config?: UrlConfig<Url>,
) => {
  return !isNil(get(config, [parameterKey])) && isNil(get(config, [schemaKey]));
};

const resolvePath = <Url extends string>(
  urlString: Url,
  config?: UrlConfig<Url>,
) => {
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
    return path as Url;
  }

  return urlString;
};

export const createUrl = <Url extends string>(
  urlString: Url,
  config?: UrlConfig<Url>,
): Error | URL | ZodError => {
  if (hasValidationError("pathVariables", "pathVariablesSchema", config)) {
    return new Error("must provide path variables schema");
  }

  const resolvedUrlString = resolvePath(urlString, config);

  if (isError(resolvedUrlString)) {
    return resolvedUrlString;
  }

  const url = attempt(() => {
    return new URL(resolvedUrlString, config?.urlBase);
  });

  if (isError(url)) {
    return url;
  }

  if (hasValidationError("searchParams", "searchParamsSchema", config)) {
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
      appendSearchParameters(url, parameters);
    }
  }

  return url;
};
