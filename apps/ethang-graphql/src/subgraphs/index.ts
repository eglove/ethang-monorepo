import { ethangCoursesFetcher } from "./ethang-courses.ts";
import { ethangRssFetcher } from "./ethang-rss.ts";

export const subgraphs: Record<
  string,
  (environment: Env, request: Request) => Promise<Response>
> = {
  "ethang-courses": ethangCoursesFetcher,
  "ethang-rss": ethangRssFetcher
};
