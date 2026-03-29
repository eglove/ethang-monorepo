import map from "lodash/map.js";
import { twMerge } from "tailwind-merge";

import {
  coursePathData,
  type CoursePathDataProperties,
} from "../../stores/course-path-store.ts";
import { globalStore } from "../../stores/global-store-properties.ts";
import { COURSE_TRACKING_STATUS } from "../../utilities/constants.ts";
import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  courses: CoursePathDataProperties["learningPaths"][number]["courses"];
  getCount: () => number;
};

export const CourseList = async (properties: CourseListProperties) => {
  return (
    <ul class="mt-2 space-y-1 ps-5">
      {map(properties.courses, async (course) => {
        const courseData = coursePathData.getCourseTracking(course.url);

        return (
          <li
            key={course._id}
            class="grid max-w-md grid-cols-[auto_1fr_auto] gap-4"
          >
            {properties.getCount()}.{" "}
            <div class="grow">
              <CourseItem courseId={course._id} />
              <div
                class={twMerge(
                  "course-status-text text-sm",
                  !globalStore.isAuthenticated && "hidden",
                )}
              >
                {courseData?.status ?? COURSE_TRACKING_STATUS.INCOMPLETE}
              </div>
            </div>{" "}
            <button
              type="button"
              data-course-id={course._id}
              data-course-url={course.url}
              title="Update course status"
              aria-label="Update course status"
              class={twMerge(
                "course-completion-button size-6 cursor-pointer self-center rounded-sm border border-slate-600 text-sky-300 focus:ring-sky-300/20",
                COURSE_TRACKING_STATUS.INCOMPLETE === courseData?.status &&
                  "bg-slate-700",
                COURSE_TRACKING_STATUS.COMPLETE === courseData?.status &&
                  "bg-sky-300",
                COURSE_TRACKING_STATUS.REVISIT === courseData?.status &&
                  "bg-amber-400",
                !globalStore.isAuthenticated && "hidden",
              )}
            />
          </li>
        );
      })}
    </ul>
  );
};
