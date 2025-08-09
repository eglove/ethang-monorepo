import { HTTP_STATUS } from "@ethang/toolbelt/constants/http";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

import { ShortUrl } from "./short-url/short-url.ts";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/", (context) => {
  const requestUrl = new URL(context.req.url);
  const root = requestUrl.origin;

  return context.json(
    {
      _links: {
        links: { href: new URL("/links", root).href },
        self: { href: new URL("/", root).href },
      },
    },
    200,
    { "Content-Type": "application/json" },
  );
});

app.get("/links", (context) => {
  const requestUrl = new URL(context.req.url);
  const root = requestUrl.origin;

  return context.json({
    _links: {
      self: { href: new URL("/links", root).href },
    },
    _templates: {
      create: {
        contentType: "application/json",
        method: "POST",
        properties: [
          {
            description: "The full URL, including the protocol (e.g., https://",
            name: "url",
            prompt: "The URL to shorten",
            required: true,
          },
        ],
        title: "Create a new short link",
      },
    },
  });
});

app.get("/links/:id", async (context) => {
  const requestUrl = new URL(context.req.url);
  const root = requestUrl.origin;
  const { id } = context.req.param();

  const shortUrl = new ShortUrl(context.env, root);
  const result = await shortUrl.getById(id);

  return context.json(result, result._status);
});

app.post(
  "/links",
  // eslint-disable-next-line lodash/prefer-lodash-method
  zValidator("json", z.object({ url: z.url().trim() })),
  async (context) => {
    const requestUrl = new URL(context.req.url);
    const root = requestUrl.origin;
    const { url } = context.req.valid("json");

    const shortUrl = new ShortUrl(context.env, root);
    const result = await shortUrl.create(url);

    return context.json(result, result._status);
  },
);

app.get("/:id", async (context) => {
  const requestUrl = new URL(context.req.url);
  const root = requestUrl.origin;
  const { id } = context.req.param();

  const shortUrl = new ShortUrl(context.env, root);
  const result = await shortUrl.getById(id);

  if (result._status === HTTP_STATUS.OK) {
    return context.redirect(result._links.redirect.href);
  }

  return context.json(result);
});

export default app;
