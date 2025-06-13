import { newsSchema } from "@ethang/schemas/src/ethang/news-schema.ts";
import { BaseStore } from "@ethang/store";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isError from "lodash/isError";
import isNil from "lodash/isNil";
import convertToString from "lodash/toString";
import { z } from "zod";

export const apiPath = "/api/news";

class NewsStore extends BaseStore<object> {
  public constructor() {
    super({});
  }

  public getNews(page?: number, limit?: number) {
    return queryOptions({
      queryFn: async () => {
        const url = createUrl(apiPath, {
          searchParams: {
            limit: isNil(limit) ? undefined : convertToString(limit),
            page: isNil(page) ? undefined : convertToString(page),
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
      },
      queryKey: ["news", page, limit],
    });
  }
}

export const newsStore = new NewsStore();
