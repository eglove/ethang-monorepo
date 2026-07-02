import { Effect, type Schema } from "effect";
import get from "lodash/get.js";
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
  pathVariablesSchema?: Schema.Schema.AnyNoContext;
  searchParams?: SearchParametersRecord;
  searchParamsSchema?: Schema.Schema.AnyNoContext;
  urlBase?: string | URL;
};

const hasValidationError = <Url extends string>(
  parameterKey: keyof UrlConfig<Url>,
  schemaKey: keyof UrlConfig<Url>,
  config?: UrlConfig<Url>
) => {
  return !isNil(get(config, [parameterKey])) && isNil(get(config, [schemaKey]));
};

const resolvePath = <Url extends string>(
  urlString: Url,
  config?: UrlConfig<Url>
): Effect.Effect<string, Error> => {
  if (!isNil(config) && !isNil(config.pathVariables)) {
    return createUrlPath(
      urlString,
      config.pathVariables,
      config.pathVariablesSchema
    );
  }

  return Effect.succeed(urlString);
};

export const createUrl = <Url extends string>(
  urlString: Url,
  config?: UrlConfig<Url>
): Effect.Effect<URL, Error> => {
  return Effect.gen(function* () {
    if (hasValidationError("pathVariables", "pathVariablesSchema", config)) {
      return yield* Effect.fail(
        new Error("must provide path variables schema")
      );
    }

    const resolvedUrlString = yield* resolvePath(urlString, config);

    const url = yield* Effect.try({
      catch: (error) => {
        return Error.isError(error) ? error : new Error(String(error));
      },
      try: () => {
        return new URL(resolvedUrlString, config?.urlBase);
      }
    });

    if (hasValidationError("searchParams", "searchParamsSchema", config)) {
      return yield* Effect.fail(
        new Error("must provide search parameters schema")
      );
    }

    if (
      !isNil(config) &&
      !isNil(config.searchParams) &&
      !isNil(config.searchParamsSchema)
    ) {
      const parameters = yield* createSearchParameters(
        config.searchParams,
        config.searchParamsSchema
      );

      if (!isNil(parameters)) {
        appendSearchParameters(url, parameters);
      }
    }

    return url;
  });
};
