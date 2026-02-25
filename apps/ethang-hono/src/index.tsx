import { Hono } from "hono";
import first from "lodash/first.js";
import isString from "lodash/isString.js";
import split from "lodash/split.js";

import { Courses } from "./components/routes/courses.tsx";
import { Home } from "./components/routes/home.tsx";
import { coursePathData } from "./path-data/course-path-data.ts";
import { type AppContext, globalStore } from "./stores/global-store.ts";

export const app = new Hono<AppContext>();

app.use("*", async (context, next) => {
  const { pathname } = new URL(context.req.url);
  const cfTimezone = context.req.raw.cf?.timezone;
  const timezone = isString(cfTimezone) ? cfTimezone : "UTC";
  const locale =
    first(split(context.req.header("Accept-Language"), ",")) ?? "en-US";

  return globalStore.run({ locale, pathname, timezone }, next);
});

app.get("/", async (c) => {
  return c.html(<Home pathname={c.get("pathname")} />);
});

app.get("/courses", async (c) => {
  await coursePathData.setCoursePathData();

  return c.html(
    <Courses
      locale={c.get("locale")}
      pathname={c.get("pathname")}
      timezone={c.get("timezone")}
    />,
  );
});

export default app;
