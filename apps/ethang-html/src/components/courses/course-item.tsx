import { getContext } from "hono/context-storage";
import { html } from "hono/html";
import find from "lodash/find";
import flatMap from "lodash/flatMap";

import type { HonoContext } from "../../index.ts";
import type { CoursesPageData } from "../../middleware/courses-data.ts";

import { link } from "../link.tsx";

type CourseItemProperties = {
  courseId: string;
};

export const courseItem = async (
  properties: Readonly<CourseItemProperties>,
) => {
  const context = getContext<HonoContext>();
  const pageData = context.get("coursesPageData");

  const course = find<CoursesPageData["paths"][0]["courses"][0]>(
    flatMap(pageData.paths, "courses"),
    {
      _id: properties.courseId,
    },
  );

  return html`
    <div>
      <div>
        ${link({
          className: "contrast",
          href: course?.url ?? "",
          isExternal: true,
          label: undefined,
          title: course?.name ?? "",
        })}
      </div>
      <small class="pico-color-slate-400">${course?.author}</small>
    </div>
  `;
};
