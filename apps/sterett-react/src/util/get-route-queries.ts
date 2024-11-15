import type { queryOptions } from "@tanstack/react-query";

import map from "lodash/map";

import { queryClient } from "../routes/root.tsx";

export const getRouteQueries = async (options: Record<string, unknown>) => {
  return Promise.all(
    map(options, async (option) => {
      return queryClient.ensureQueryData(
        option as ReturnType<typeof queryOptions>,
      );
    }),
  );
};
