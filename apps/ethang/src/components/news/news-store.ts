import { newsSchema } from "@ethang/schemas/src/ethang/news-schema.ts";
import { BaseStore } from "@ethang/store";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isError from "lodash/isError";
import convertToString from "lodash/toString";
import { z } from "zod";

export const apiPath = "/api/news";

const initialState = {};

export const NEWS_INITIAL_LIMIT = 6;

class NewsStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  public getNews(page = 1) {
    return queryOptions({
      queryFn: async () => {
        return this.getNewsQuery(page);
      },
      queryKey: ["news", page],
    });
  }

  public async getNewsQuery(page = 1) {
    const url = createUrl(apiPath, {
      searchParams: {
        limit: convertToString(NEWS_INITIAL_LIMIT),
        page: convertToString(page),
      },
      searchParamsSchema: z.object({
        limit: z.string().optional(),
        page: z.string().optional(),
      }),
      urlBase: globalThis.location.origin,
    });

    if (isError(url)) {
      throw new Error("Invalid URL");
    }

    const data = await fetchJson(
      url,
      z.object({
        news: z.array(newsSchema),
        pagination: z.object({
          limit: z.number(),
          page: z.number(),
          total: z.number(),
          totalPages: z.number(),
        }),
      }),
    );

    if (isError(data)) {
      throw new Error("Invalid projects data");
    }

    return data;
  }
}

export const newsStore = new NewsStore();
