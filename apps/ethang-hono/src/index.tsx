import { Hono } from "hono";
import isNil from "lodash/isNil.js";

import { Blog } from "./components/routes/blog.tsx";
import { BlogPost } from "./components/routes/blog/blog-post.tsx";
import { Courses } from "./components/routes/courses.tsx";
import { Home } from "./components/routes/home.tsx";
import { NotFound } from "./components/routes/not-found.tsx";
import { SignIn } from "./components/routes/sign-in.tsx";
import { Tips } from "./components/routes/tips.tsx";
import { ScrollContainers } from "./components/routes/tips/scroll-containers.tsx";
import { ScrollbarGutter } from "./components/routes/tips/scrollbar-gutter.tsx";
import { getDatabase } from "./db/database.ts";
import { blogRss } from "./feeds/blog-rss.ts";
import { CourseTracking } from "./models/course-tracking.ts";
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

  globalStore.setup(context);
  return next();
});

app.notFound(async (c) => {
  return c.html(<NotFound />);
});

app.get("/", async (c) => {
  return c.html(<Home />);
});

app.get("/sign-in", async (c) => {
  return c.html(<SignIn />);
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

app.get("/blogRss.xml", async (c) => {
  const content = await blogRss();

  c.header("Content-Type", "text/xml");

  return c.text(content);
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
    if (COURSE_TRACKING_STATUS.COMPLETE === courseStatus?.status) {
      await courseTracking.updateCourseTrackingStatus(
        courseStatus.id,
        COURSE_TRACKING_STATUS.REVISIT,
      );
    }

    if (COURSE_TRACKING_STATUS.REVISIT === courseStatus?.status) {
      await courseTracking.updateCourseTrackingStatus(
        courseStatus.id,
        COURSE_TRACKING_STATUS.INCOMPLETE,
      );
    }

    if (COURSE_TRACKING_STATUS.INCOMPLETE === courseStatus?.status) {
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
  console.log({ courseId, updated, userId });

  return context.json({ data: updated, status: 200 });
});

export default app;
