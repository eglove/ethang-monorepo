import type { MiddlewareHandler } from "hono";

import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import { DateTime } from "luxon";

export const lastModifiedMiddleware: MiddlewareHandler = async (
  context,
  next
) => {
  await next();
  // c.res.clone() is safe here: clone() creates a new Response that shares the
  // same underlying body stream. Calling .text() on the clone reads the clone's
  // copy, leaving c.res.body intact. Hono's c.html() always produces a fully
  // buffered body, so the clone is consumed synchronously in memory.
  if (
    !context.res.body ||
    !includes(context.res.headers.get("content-type") ?? "", "text/html")
  ) {
    return;
  }

  const text = await context.res.clone().text();
  const tagMatch = /<meta[^>]+name="last-modified"[^>]*>/iu.exec(text);
  if (!tagMatch) {
    return;
  }
  const contentMatch = /content="(?<v>[^"]+)"/iu.exec(tagMatch[0]);
  const content = contentMatch?.groups?.["v"];
  if (isNil(content)) {
    return;
  }
  const fromHTTP = DateTime.fromHTTP(content);
  const fromIso = DateTime.fromISO(content);
  if (!fromHTTP.isValid && !fromIso.isValid) {
    return;
  }
  const headers = new Headers(context.res.headers);

  if (fromHTTP.isValid) {
    headers.set("Last-Modified", fromHTTP.toHTTP());
  }

  if (fromIso.isValid) {
    headers.set("Last-Modified", fromIso.toHTTP());
  }

  context.res = new Response(context.res.body, {
    headers,
    status: context.res.status,
    statusText: context.res.statusText
  });
};
