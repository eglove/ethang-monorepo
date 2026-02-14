import { Hono } from "hono";
import { contextStorage } from "hono/context-storage";

import type { CoursesPageData } from "./middleware/courses-data";

import { coursesDataMiddleware } from "./middleware/courses-data.ts";
import { notFound } from "./pages/404.tsx";
import { courses } from "./pages/courses.tsx";
import { home } from "./pages/home.tsx";

export type HonoContext = {
  Bindings: CloudflareBindings;
  Variables: {
    coursesPageData: CoursesPageData;
  };
};

const app = new Hono<HonoContext>();

app.use("*", contextStorage());

app.get("/", async (c) => {
  return c.html(home());
});

app.use("/courses", coursesDataMiddleware);
app.get("/courses", async (c) => {
  return c.html(courses());
});

app.notFound(async (c) => {
  return c.html(notFound());
});

export default app;
