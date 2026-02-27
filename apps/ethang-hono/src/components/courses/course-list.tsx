import map from "lodash/map.js";

import { CourseItem } from "./course-item.tsx";

type CourseListProperties = {
  courses: { _id: string }[];
};

export const CourseList = async (properties: CourseListProperties) => {
  return (
    <div class="border-linear-to-b relative ml-6 border-l-4 from-indigo-500 via-fuchsia-500 to-amber-500 dark:from-indigo-400 dark:via-fuchsia-400 dark:to-amber-400">
      <ul class="flex flex-col gap-10 py-4">
        {map(properties.courses, async (course) => (
          <li key={course._id} class="relative pl-12">
            <div class="absolute top-1/2 -left-1 h-1 w-10 -translate-y-1/2 rounded-full bg-linear-to-r from-indigo-500 to-transparent dark:from-indigo-400" />
            <CourseItem courseId={course._id} />
          </li>
        ))}
      </ul>
    </div>
  );
};
