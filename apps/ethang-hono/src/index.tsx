import { Hono } from "hono";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString.js";

import { routes } from "../routes.ts";
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
import { getDatabase } from "./db/database.ts";
import { blogRss } from "./feeds/blog-rss.ts";
import { lastModifiedMiddleware } from "./middleware/last-modified.ts";
import { BlogModel } from "./models/blog-model.ts";
import { CourseTracking } from "./models/course-tracking.ts";
import { sitemap } from "./sitemap.ts";
import { coursePathData } from "./stores/course-path-store.ts";
import {
  type AppContext,
  globalStore,
} from "./stores/global-store-properties.ts";
import { COURSE_TRACKING_STATUS } from "./utilities/constants.ts";

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
      "Content-Type": "application/xml",
    },
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

  if (!rawPage || isNaN(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return c.redirect("/blog", 302);
  }

  if (parsed === 1) {
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

app.get("/api/course-tracking/:userId/:courseId", async (context) => {
  const userId = context.req.param("userId");
  const courseId = context.req.param("courseId");

  const courseTracking = new CourseTracking(getDatabase(context));
  const courseStatus = await courseTracking.getCourseTrackingByUserIdCourseId(
    userId,
    courseId,
  );

  return context.json({ data: courseStatus, status: 200 });
});

app.get("/api/course-tracking/:userId", async (context) => {
  const userId = context.req.param("userId");

  const courseTracking = new CourseTracking(getDatabase(context));
  const courseStatuses = await courseTracking.getCourseTrackingByUserId(userId);

  return context.json({ data: courseStatuses, status: 200 });
});

app.put("/api/course-tracking/:userId/:courseId", async (context) => {
  const userId = context.req.param("userId");
  const courseId = context.req.param("courseId");

  const courseTracking = new CourseTracking(getDatabase(context));
  const courseStatus = await courseTracking.getCourseTrackingByUserIdCourseId(
    userId,
    courseId,
  );

  if (isNil(courseStatus)) {
    await courseTracking.createCourseTracking(userId, courseId);
  } else {
    if (COURSE_TRACKING_STATUS.COMPLETE === courseStatus.status) {
      await courseTracking.updateCourseTrackingStatus(
        courseStatus.id,
        COURSE_TRACKING_STATUS.REVISIT,
      );
    }

    if (COURSE_TRACKING_STATUS.REVISIT === courseStatus.status) {
      await courseTracking.updateCourseTrackingStatus(
        courseStatus.id,
        COURSE_TRACKING_STATUS.INCOMPLETE,
      );
    }

    if (COURSE_TRACKING_STATUS.INCOMPLETE === courseStatus.status) {
      await courseTracking.updateCourseTrackingStatus(
        courseStatus.id,
        COURSE_TRACKING_STATUS.COMPLETE,
      );
    }
  }

  const updated = await courseTracking.getCourseTrackingByUserIdCourseId(
    userId,
    courseId,
  );

  return context.json({ data: updated, status: 200 });
});

export default app;
