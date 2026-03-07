import map from "lodash/map.js";
import { twMerge } from "tailwind-merge";

import { coursePathData } from "../../stores/course-path-store.ts";
import { globalStore } from "../../stores/global-store-properties.ts";
import { COURSE_TRACKING_STATUS } from "../../utilities/constants.ts";
import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  courses: { _id: string }[];
  getCount: () => number;
};

export const CourseList = async (properties: CourseListProperties) => {
  return (
    <ul class="mt-2 space-y-1 ps-5">
      {map(properties.courses, async (course) => {
        const courseData = coursePathData.getCourseTracking(course._id);

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
              title="Update course status"
              aria-label="Update course status"
              class={twMerge(
                "course-completion-button size-6 cursor-pointer self-center rounded-sm border border-default-medium text-brand focus:ring-brand",
                COURSE_TRACKING_STATUS.INCOMPLETE === courseData?.status &&
                  "bg-neutral-secondary-medium",
                COURSE_TRACKING_STATUS.COMPLETE === courseData?.status &&
                  "bg-brand",
                COURSE_TRACKING_STATUS.REVISIT === courseData?.status &&
                  "bg-warning",
                !globalStore.isAuthenticated && "hidden",
              )}
            />
          </li>
        );
      })}
    </ul>
  );
};
