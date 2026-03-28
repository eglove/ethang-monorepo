import type { MiddlewareHandler } from "hono";

import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";

export const lastModifiedMiddleware: MiddlewareHandler = async (c, next) => {
  await next();
  if (
    !c.res.body ||
    !includes(c.res.headers.get("content-type") ?? "", "text/html")
  ) {
    return;
  }

  const text = await c.res.clone().text();
  const tagMatch = /<meta[^>]+name="last-modified"[^>]*>/iu.exec(text);
  if (!tagMatch) {
    return;
  }
  const contentMatch = /content="(?<v>[^"]+)"/iu.exec(tagMatch[0]);
  if (isNil(contentMatch?.groups?.["v"])) {
    return;
  }
  const date = new Date(contentMatch.groups["v"]);
  if (Number.isNaN(date.getTime())) {
    return;
  }
  const headers = new Headers(c.res.headers);
  headers.set("Last-Modified", date.toUTCString());
  c.res = new Response(c.res.body, {
    headers,
    status: c.res.status,
    statusText: c.res.statusText,
  });
};
