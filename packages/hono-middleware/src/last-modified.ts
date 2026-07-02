import type { MiddlewareHandler } from "hono";

import { DateTime, Option } from "effect";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";

const setLastModifiedHeader = (headers: Headers, content: string) => {
  // Try strict ISO parsing first via Effect DateTime
  const maybeIso = DateTime.make(content);
  if (Option.isSome(maybeIso)) {
    headers.set(
      "Last-Modified",
      DateTime.toDateUtc(maybeIso.value).toUTCString()
    );
    return;
  }

  // Fall back to Date.parse for RFC 2822 / RFC 850 / asctime
  // eslint-disable-next-line unicorn/prefer-temporal
  const epoch = Date.parse(content);
  if (Number.isNaN(epoch)) {
    return;
  }
  const parsedDate = DateTime.toDateUtc(DateTime.unsafeMake(epoch));
  headers.set("Last-Modified", parsedDate.toUTCString());
};

export const lastModifiedMiddleware: MiddlewareHandler = async (
  context,
  next
) => {
  await next();
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
  const headers = new Headers(context.res.headers);

  setLastModifiedHeader(headers, content);

  context.res = new Response(context.res.body, {
    headers,
    status: context.res.status,
    statusText: context.res.statusText
  });
};
