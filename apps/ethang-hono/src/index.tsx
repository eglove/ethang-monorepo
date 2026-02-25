import { Hono } from "hono";

import { Courses } from "./components/routes/courses.tsx";
import { Home } from "./components/routes/home.tsx";
import { coursePathData } from "./stores/course-path-store.ts";
import {
  type AppContext,
  globalStore,
} from "./stores/global-store-properties.ts";

export const app = new Hono<AppContext>();

app.use("*", async (context, next) => {
  globalStore.setup(context);
  return next();
});

app.get("/", async (c) => {
  return c.html(<Home />);
});

app.get("/courses", async (c) => {
  await coursePathData.setup();

  return c.html(<Courses />);
});

export default app;
