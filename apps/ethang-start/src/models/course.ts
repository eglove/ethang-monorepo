import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";

export const getCourses = createServerFn().handler(async () => {
  const data = await env.ethang_courses.coursesAll();

  if (data instanceof Response) {
    return data.json<typeof data>();
  }

  return data;
});
