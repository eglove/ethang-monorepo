import { createMiddleware } from "hono/factory";
import isString from "lodash/isString";
import split from "lodash/split";
import trim from "lodash/trim";
import { DateTime } from "luxon";

import { sanityClient } from "../clients/sanity-client.ts";

export type CoursesPageData = {
  lastUpdated: string;
  locale: string;
  paths: {
    _id: string;
    courseCount: number;
    courses: {
      _id: string;
      author: string;
      name: string;
      url: string;
    }[];
    name: string;
    swebokFocus: string;
    url: string;
  }[];
  timezone: unknown;
  totalCourseCount: number;
};

export const coursesDataMiddleware = createMiddleware(async (c, next) => {
  const data = await sanityClient.fetch<CoursesPageData>(`{
    "paths": *[_type == "learningPath"] | order(orderRank) {
      _id,
      name,
      url,
      swebokFocus,
      "courseCount": count(courses),
      "courses": courses[]->{
        _id,
        url,
        name,
        author
      }
    },
    "lastUpdated": *[_type in ["course", "learningPath"]] | order(_updatedAt desc)[0]._updatedAt,
    "totalCourseCount": count(*[_type == "course"])
  }`);

  const timezone = c.req.raw.cf?.timezone;

  c.set("coursesPageData", {
    ...data,
    lastUpdated: DateTime.fromJSDate(new Date(data.lastUpdated), {
      zone: isString(timezone) ? timezone : "UTC",
    }).toLocaleString({
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      timeZoneName: "short",
      year: "numeric",
    }),
    locale: trim(split(c.req.header("accept-language"), ",")[0] ?? "en-US"),
    timezone,
  });
  await next();
});
