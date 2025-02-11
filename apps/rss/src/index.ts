import { fromHono } from "chanfana";
import { type Context, Hono } from "hono";
import { cors } from "hono/cors";

import { authMiddleware } from "./auth-middleware.js";
import { FeedGet } from "./endpoints/feed-get.js";
import { FeedsGet } from "./endpoints/feeds-get.js";
import { RssFeedCreate } from "./endpoints/rss-feed-create.js";
import { ValidFeedGet } from "./endpoints/valid-feed-get.js";

export type AppContext = Context<{ Bindings: Bindings }>;
type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();
app.use("*", cors());
app.use("*", authMiddleware);

const openapi = fromHono(app, {
  docs_url: "/",
});

openapi.get("/feeds", FeedsGet);
openapi.get("/feed", FeedGet);
openapi.get("/valid-feed", ValidFeedGet);
openapi.post("/rss-feed", RssFeedCreate);

export default app;
