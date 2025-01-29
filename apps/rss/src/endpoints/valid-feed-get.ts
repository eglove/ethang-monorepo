import type { Context } from "hono";

import { HTTP_STATUS } from "@ethang/toolbelt/src/constants/http.js";
import { OpenAPIRoute } from "chanfana";
import isError from "lodash/isError.js";
import { z } from "zod";

import { isValidRss } from "../functions/is-valid-rss.js";

export class ValidFeedGet extends OpenAPIRoute {
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
              error: z.string(),
              success: z.literal(false),
            }),
          },
        },
        description: "Internal server error",
      },
      [HTTP_STATUS.OK]: {
        content: {
          "application/json": {
            schema: z.object({
              data: z.literal(true),
              success: z.boolean(),
            }),
          },
        },
        description: "Returns true if the feed is valid",
      },
    },
    summary: "Check if a feed is valid",
    tags: ["Feeds"],
  };

  public override async handle(context: Context) {
    const data = await this.getValidatedData<typeof this.schema>();

    const isValid = await isValidRss(data.query.url);

    if (isError(isValid)) {
      return context.json(
        {
          error: isValid.message,
          success: false,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return context.json(
      {
        data: isValid,
        success: true,
      },
      HTTP_STATUS.OK,
    );
  }
}
