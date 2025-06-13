import { projectSchema } from "@ethang/schemas/src/ethang/project-schema.ts";
import { BaseStore } from "@ethang/store";
import { createUrl } from "@ethang/toolbelt/fetch/create-url";
import { fetchJson } from "@ethang/toolbelt/fetch/fetch-json";
import { queryOptions } from "@tanstack/react-query";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import convertToString from "lodash/toString.js";
import { z } from "zod";

export const apiPath = "/api/project";

class ProjectStore extends BaseStore<object> {
  public constructor() {
    super({});
  }

  public getProjects(page?: number, limit?: number) {
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

        console.log(url);

        if (isError(url)) {
          throw new Error("Invalid URL");
        }

        const data = await fetchJson(
          url,
          z.object({
            pagination: z.object({
              limit: z.number(),
              page: z.number(),
              total: z.number(),
              totalPages: z.number(),
            }),
            projects: z.array(projectSchema),
          }),
        );

        if (isError(data)) {
          throw new Error("Invalid projects data");
        }

        return data;
      },
      queryKey: ["projects", page, limit],
    });
  }
}

export const projectStore = new ProjectStore();
