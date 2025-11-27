import { queryOptions } from "@tanstack/react-query";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty";
import set from "lodash/set";

import type { Video } from "../../shared/types.ts";

import { getVideosUrl, updateFeedsUrl } from "../../shared/api-urls.ts";

export const updateFeedsQuery = queryOptions({
  queryFn: async () => {
    const response = await fetch(updateFeedsUrl);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.ok;
  },
  queryKey: [updateFeedsUrl],
});

export const getVideosQuery = queryOptions({
  queryFn: async (context) => {
    const response = await fetch(getVideosUrl);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = await response.json<Video[]>();

    if (isEmpty(data) && true !== get(context, ["meta", "hasRetried"])) {
      await context.client.fetchQuery(updateFeedsQuery);
      await context.client.invalidateQueries({ queryKey: [getVideosUrl] });
      set(context, ["meta", "hasRetried"], true);
    } else {
      context.client
        .fetchQuery(updateFeedsQuery)
        .catch(globalThis.console.error);
      set(context, ["meta", "hasRetried"], false);
    }

    return data;
  },
  queryKey: [getVideosUrl],
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  staleTime: Infinity,
});
