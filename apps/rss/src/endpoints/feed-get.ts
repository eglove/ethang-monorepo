import { HTTP_STATUS } from "@ethang/toolbelt/src/constants/http.js";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import { Bool, OpenAPIRoute, Str } from "chanfana";
import isError from "lodash/isError.js";
import { parse } from "rss-to-json";
import { z } from "zod";

import type { AppContext } from "../index.js";

export class FeedGet extends OpenAPIRoute {
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
    summary: "Get feed items from a page",
    tags: ["Feeds"],
  };

  public override async handle(context: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();
    const feed = await attemptAsync(async () => {
      return parse(data.query.url);
    });

    if (isError(feed)) {
      return context.json(
        {
          error: "Could not parse feed",
          success: false,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return context.json(
      {
        data: feed,
        success: true,
      },
      HTTP_STATUS.OK,
    );
  }
}
