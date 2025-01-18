import {
  createJsonResponse,
} from "@ethang/toolbelt/src/fetch/create-json-response.ts";
import { attemptAsync } from "@ethang/toolbelt/src/functional/attempt-async.js";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import { v7 } from "uuid";
import { z } from "zod";

const dataSchema = z.object({
  browser: z.string().optional(),
  device: z.string().optional(),
  eventName: z.string().optional(),
  location: z.string().optional(),
  referrer: z.string().url()
    .optional(),
  url: z.string().url()
    .optional(),
});

export const fromDataParameter = async (
  request: Request,
  environment: Env,
) => {
  const url = new URL(request.url);
  const base64String = url.searchParams.get("data");

  if (isNil(base64String)) {
    return createJsonResponse({ error: "Invalid Request" }, "BAD_REQUEST");
  }

  const decoded = atob(base64String);
  const { data, error } = dataSchema.safeParse(JSON.parse(decoded));

  if (error) {
    return createJsonResponse({ error: "Invalid Request" }, "BAD_REQUEST");
  }

  const values = [
    v7(),
    data.browser ?? null,
    data.device ?? null,
    data.eventName ?? null,
    data.location ?? null,
    data.referrer ?? null,
    data.url ?? null,
  ];

  const result = await attemptAsync(async () => {
    return environment.DB.prepare("INSERT INTO Track (id, browser, device, eventName, location, referrer, url) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(...values)
      .run();
  });

  if (isError(result)) {
    return createJsonResponse({ error: "Error creating event" }, "INTERNAL_SERVER_ERROR");
  }

  return createJsonResponse({ message: "Created" }, "CREATED");
};
