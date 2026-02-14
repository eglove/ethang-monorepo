import { getContext } from "hono/context-storage";
import { html } from "hono/html";
import filter from "lodash/filter";
import flatMap from "lodash/flatMap";
import map from "lodash/map";

import type { HonoContext } from "../../index.ts";

import { courseItem } from "./course-item.tsx";

type CourseListProperties = {
  pathId: string;
};

export const courseList = async (
  properties: Readonly<CourseListProperties>,
) => {
  const context = getContext<HonoContext>();
  const pageData = context.get("coursesPageData");

  const filtered = filter(pageData.paths, ["_id", properties.pathId]);

  const courseIds = flatMap(filtered, (path) => {
    return map(path.courses, "_id");
  });

  return html`
    <div style="display: grid; gap: 16px">
      ${map(courseIds, async (courseId) => {
        return courseItem({ courseId });
      })}
    </div>
  `;
};
