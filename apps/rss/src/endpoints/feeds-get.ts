import { HTTP_STATUS } from "@ethang/toolbelt/constants/http.js";
import { Bool, OpenAPIRoute, Str } from "chanfana";
import isError from "lodash/isError.js";
import { z } from "zod";

import type { AppContext } from "../index.js";

import { getRssUrls } from "../functions/get-rss-urls.js";

export class FeedsGet extends OpenAPIRoute {
  public override readonly schema = {
    request: {
      query: z.object({
        url: z.string().url(),
      }),
    },
    responses: {
      [HTTP_STATUS.INTERNAL_SERVER_ERROR]: {
        content: {
          "application/json": {
            schema: z.object({
              error: Str(),
              success: Bool(),
            }),
          },
        },
        description: "Internal server error",
      },
      [HTTP_STATUS.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              data: z.array(z.string()),
              success: Bool(),
            }),
          },
        },
        description: "Returns a list of feeds found on the page",
      },
    },
    summary: "Get feeds from a page",
    tags: ["Feeds"],
  };

  public override async handle(context: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const feeds = await getRssUrls(data.query.url);

    if (isError(feeds)) {
      return context.json(
        {
          error: feeds.message,
          success: false,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return context.json(
      {
        data: feeds,
        success: true,
      },
      HTTP_STATUS.OK,
    );
  }
}
