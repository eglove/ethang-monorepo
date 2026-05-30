import { lastModifiedMiddleware } from "@ethang/hono-middleware/src/last-modified.ts";
import { Hono } from "hono";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { routes } from "../routes.ts";
import {
  cycleCourseTrackingStatus,
  getCourseTrackingByUserIdCourseId,
  getCourseTrackingsByUserId
} from "./clients/course-tracking-graphql.ts";
import { Blog } from "./components/routes/blog.tsx";
import { BlogPost } from "./components/routes/blog/blog-post.tsx";
import { coursesText } from "./components/routes/courses-text.ts";
import { Courses } from "./components/routes/courses.tsx";
import { Home } from "./components/routes/home.tsx";
import { NotFound } from "./components/routes/not-found.tsx";
import { SignIn } from "./components/routes/sign-in.tsx";
import { Tips } from "./components/routes/tips.tsx";
import { ScrollContainers } from "./components/routes/tips/scroll-containers.tsx";
import { ScrollbarGutter } from "./components/routes/tips/scrollbar-gutter.tsx";
import { blogRss } from "./feeds/blog-rss.ts";
import { BlogModel } from "./models/blog-model.ts";
import { sitemap } from "./sitemap.ts";
import { coursePathData } from "./stores/course-path-store.ts";
import {
  type AppContext,
  globalStore
} from "./stores/global-store-properties.ts";

export const app = new Hono<AppContext>();

app.use("*", async (context, next) => {
  const url = new URL(context.req.url);

  if ("www.ethang.dev" === url.hostname) {
    return Response.redirect(`https://ethang.dev${url.pathname}${url.search}`);
  }

  await globalStore.setup(context);
  return next();
});

app.use("*", lastModifiedMiddleware);

app.notFound(async (c) => {
  return c.html(<NotFound />, 404);
});

app.get("/", async (c) => {
  return c.html(<Home />);
});

app.get("/sitemap.xml", async () => {
  const sitemapString = await sitemap();

  return new Response(sitemapString, {
    headers: {
      "Content-Type": "application/xml"
    }
  });
});

app.get("/sign-in", async (c) => {
  return c.html(<SignIn />);
});

app.get(routes.courses, async (c) => {
  await coursePathData.setup(c);

  const format = c.req.query("format");

  if (isString(format) && "text" === format) {
    return c.text(coursesText());
  }

  return c.html(<Courses />);
});

app.get(routes.tips, async (c) => {
  return c.html(<Tips />);
});

app.get(routes.scrollContainers, async (c) => {
  return c.html(<ScrollContainers />);
});

app.get(routes.scrollbarGutter, async (c) => {
  return c.html(<ScrollbarGutter />);
});

app.get(routes.blog, async (c) => {
  return c.html(<Blog />);
});

app.get("/blog/page/:page", async (c) => {
  const rawPage = c.req.param("page");

  const parsed = Number(rawPage);

  if (
    !rawPage ||
    Number.isNaN(parsed) ||
    !Number.isInteger(parsed) ||
    1 > parsed
  ) {
    return c.redirect("/blog", 302);
  }

  if (1 === parsed) {
    return c.redirect("/blog", 301);
  }

  const blogModel = new BlogModel();
  const { maxPages } = await blogModel.getPaginatedBlogs(parsed, 10);

  if (parsed > maxPages) {
    return c.redirect(`/blog/page/${maxPages}`, 302);
  }

  return c.html(<Blog page={parsed} />);
});

app.get("/blog/:slug", async (c) => {
  const slug = c.req.param("slug");

  return c.html(<BlogPost slug={slug} />);
});

app.get("/blogRss.xml", async (c) => {
  const content = await blogRss();
  return c.text(content, 200, { "Content-Type": "text/xml" });
});

app.get("/api/course-tracking/:courseId", async (context) => {
  const userId = context.req.query("userId");
  const courseId = context.req.param("courseId");

  if (isNil(userId)) {
    return context.json({ data: null, status: 400 });
  }

  const courseStatus = await getCourseTrackingByUserIdCourseId(
    context,
    userId,
    courseId
  );

  return context.json({ data: courseStatus, status: 200 });
});

app.get("/api/course-tracking", async (context) => {
  const userId = context.req.query("userId");

  if (isNil(userId)) {
    return context.json({ data: null, status: 400 });
  }

  const courseStatuses = await getCourseTrackingsByUserId(context, userId);

  return context.json({ data: courseStatuses, status: 200 });
});

app.put("/api/course-tracking/:courseId", async (context) => {
  const userId = context.req.query("userId");
  const courseId = context.req.param("courseId");

  if (isNil(userId)) {
    return context.json({ data: null, status: 400 });
  }

  const updated = await cycleCourseTrackingStatus(context, userId, courseId);

  return context.json({ data: updated, status: 200 });
});

export default app;
