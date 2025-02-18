import { HTTP_STATUS } from "@ethang/toolbelt/constants/http.js";
import { attemptAsync } from "@ethang/toolbelt/functional/attempt-async.js";
import { OpenAPIRoute } from "chanfana";
import { load } from "cheerio";
import isError from "lodash/isError.js";
import { v7 } from "uuid";
import { z } from "zod";

import type { AppContext } from "../index.js";

import { isValidRss } from "../functions/is-valid-rss.js";
import { RssFeedSchema } from "../types.js";

export class RssFeedCreate extends OpenAPIRoute {
  public override readonly schema = {
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              url: z.string().url(),
            }),
          },
        },
      },
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
              data: RssFeedSchema,
              success: z.literal(true),
            }),
          },
        },
        description: "Success",
      },
    },
    summary: "Create a new RSS feed",
    tags: ["Feeds"],
  };

  public override async handle(context: AppContext) {
    const data = await this.getValidatedData<typeof this.schema>();

    const isValid = await isValidRss(data.body.url);

    if (isError(isValid) || !isValid) {
      return context.json(
        {
          error: "Invalid RSS feed",
          success: false,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const rss = await attemptAsync(async () => {
      const response = await fetch(data.body.url);
      return response.text();
    });

    if (isError(rss)) {
      return context.json(
        {
          error: "Could not fetch RSS feed",
          success: false,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const cheerio = load(rss);
    const title = cheerio("title").first().text();
    const description = cheerio("description").first().text();

    const database = context.env.DB;

    const id = v7();
    const result = await attemptAsync(async () => {
      return database
        .prepare(
          "INSERT INTO RssFeed (id, title, url, description) VALUES (?, ?, ?, ?)",
        )
        .bind(id, title, data.body.url, description)
        .first();
    });

    if (isError(result)) {
      return context.json(
        {
          error: "Could not create RSS feed",
          success: false,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    const value = await attemptAsync(async () => {
      return database
        .prepare("SELECT * FROM RssFeed WHERE id = ?")
        .bind(id)
        .first();
    });

    if (isError(value)) {
      return context.json(
        {
          error: "Could not get RSS feed",
          success: false,
        },
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
      );
    }

    return context.json(
      {
        data: value,
        success: true,
      },
      HTTP_STATUS.OK,
    );
  }
}
