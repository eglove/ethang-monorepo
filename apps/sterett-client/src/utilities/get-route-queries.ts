import type { EnsureQueryDataOptions } from "@tanstack/react-query";

import map from "lodash/map";

import { queryClient } from "../routes/__root.tsx";

export const getRouteQueries = async <T>(
  options: Record<string, EnsureQueryDataOptions<T>>,
) => {
  return Promise.all(
    map(options, async (option) => {
      return queryClient.ensureQueryData(option);
    }),
  );
};
