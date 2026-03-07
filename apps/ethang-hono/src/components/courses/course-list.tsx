import map from "lodash/map.js";

import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  courses: { _id: string }[];
  getCount: () => number;
};

export const CourseList = async (properties: CourseListProperties) => {
  return (
    <ul class="mt-2 space-y-1 ps-5">
      {map(properties.courses, async (course) => (
        <li
          key={course._id}
          class="grid max-w-md grid-cols-[auto_1fr_auto] gap-4"
        >
          {properties.getCount()}.{" "}
          <div class="grow">
            <CourseItem courseId={course._id} />
            <div class="course-status-text hidden text-sm">Incomplete</div>
          </div>{" "}
          <button
            type="button"
            data-course-id={course._id}
            title="Update course status"
            aria-label="Update course status"
            class="course-completion-button hidden size-6 cursor-pointer self-center rounded-sm border border-default-medium bg-neutral-secondary-medium text-brand focus:ring-brand"
          />
        </li>
      ))}
    </ul>
  );
};
