import { Hono } from "hono";

import { Blog } from "./components/routes/blog.tsx";
import { BlogPost } from "./components/routes/blog/blog-post.tsx";
import { Courses } from "./components/routes/courses.tsx";
import { Home } from "./components/routes/home.tsx";
import { NotFound } from "./components/routes/not-found.tsx";
import { Tips } from "./components/routes/tips.tsx";
import { ScrollContainers } from "./components/routes/tips/scroll-containers.tsx";
import { ScrollbarGutter } from "./components/routes/tips/scrollbar-gutter.tsx";
import { coursePathData } from "./stores/course-path-store.ts";
import {
  type AppContext,
  globalStore,
} from "./stores/global-store-properties.ts";

export const app = new Hono<AppContext>();

app.use("*", async (context, next) => {
  const url = new URL(context.req.url);

  if ("www.ethang.dev" === url.hostname) {
    return Response.redirect(`https://ethang.dev${url.pathname}${url.search}`);
  }

  globalStore.setup(context);
  return next();
});

app.notFound(async (c) => {
  return c.html(<NotFound />);
});

app.get("/", async (c) => {
  return c.html(<Home />);
});

app.get("/courses", async (c) => {
  await coursePathData.setup();

  return c.html(<Courses />);
});

app.get("/tips", async (c) => {
  return c.html(<Tips />);
});

app.get("/tips/scroll-containers", async (c) => {
  return c.html(<ScrollContainers />);
});

app.get("/tips/scrollbar-gutter", async (c) => {
  return c.html(<ScrollbarGutter />);
});

app.get("/blog", async (c) => {
  return c.html(<Blog />);
});

app.get("/blog/:slug", async (c) => {
  const slug = c.req.param("slug");

  return c.html(<BlogPost slug={slug} />);
});

export default app;
