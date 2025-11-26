import { queryOptions } from "@tanstack/react-query";

import type { Video } from "../../shared/types.ts";

import { getVideosUrl, updateFeedsUrl } from "../../shared/api-urls.ts";

export const pollFeedsQuery = queryOptions({
  queryFn: async () => {
    const response = await fetch(updateFeedsUrl);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.ok;
  },
  queryKey: [updateFeedsUrl],
  refetchInterval: 1000 * 60 * 60,
});

export const getVideosQuery = queryOptions({
  queryFn: async () => {
    const response = await fetch(getVideosUrl);

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    return response.json<Video[]>();
  },
  queryKey: [getVideosUrl],
});
