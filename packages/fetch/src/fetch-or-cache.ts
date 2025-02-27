import type { z } from "zod";

import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";

export type FetchAndCacheMode =
  | "cacheFirst"
  | "cacheOnly"
  | "networkFirst"
  | "networkOnly";

type FetchOrCacheProperties<T> = {
  getCachedValue?: () => Promise<T>;
  init?: RequestInit;
  input: Request | string | URL;
  mode?: FetchAndCacheMode | undefined;
  schema: z.ZodSchema<T>;
  setCachedValue?: (value: T) => Promise<unknown>;
};

export const fetchOrCache = async <T>(
  parameters: FetchOrCacheProperties<T>,
) => {
  switch (parameters.mode ?? "cacheFirst") {
    case "cacheFirst": {
      const cached = await attemptAsync(async () => {
        return parameters.getCachedValue?.();
      });

      if (isError(cached) || isNil(cached)) {
        return fetchJson(parameters.input, parameters.schema, parameters.init);
      }

      fetchJson(parameters.input, parameters.schema, parameters.init)
        .then((data) => {
          if (!isError(data)) {
            parameters.setCachedValue?.(data).catch(globalThis.console.error);
          }
        })
        .catch(globalThis.console.error);

      return cached;
    }

    case "cacheOnly": {
      return attemptAsync(async () => {
        return parameters.getCachedValue?.();
      });
    }

    case "networkFirst": {
      const data = await fetchJson(
        parameters.input,
        parameters.schema,
        parameters.init,
      );

      if (isError(data) || isNil(data)) {
        return parameters.getCachedValue?.();
      }

      parameters.setCachedValue?.(data).catch(globalThis.console.error);

      return data;
    }

    case "networkOnly": {
      return fetchJson(parameters.input, parameters.schema, parameters.init);
    }
  }
};
