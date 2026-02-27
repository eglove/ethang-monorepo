import get from "lodash/get.js";
import { DateTime } from "luxon";

import { coursePathData } from "../../stores/course-path-store.ts";
import { globalStore } from "../../stores/global-store-properties.ts";
import { CoursesContainer } from "../courses/courses-container.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";
import { H1 } from "../typography/h1.tsx";
import { P } from "../typography/p.tsx";

export const Courses = async () => {
  const { latestUpdate, totalCourseCount } = coursePathData;

  const formatted = DateTime.fromISO(
    get(latestUpdate, ["_updatedAt"], DateTime.now().toISO()),
    {
      locale: globalStore.locale,
      zone: globalStore.timezone,
    },
  ).toLocaleString({
    dateStyle: "medium",
    timeStyle: "long",
  });

  return (
    <MainLayout
      title="Recommended Courses"
      imageUrl="/images/generated/Gemini_Generated_Image_2ac79s2ac79s2ac7.png"
      description="A curated list of recommended courses for development. Learn from industry experts and stay up-to-date with the latest technologies."
    >
      <div class="mx-auto max-w-7xl">
        <H1>Recommended Courses</H1>
        <P>Last Updated: {formatted}</P>
        <P>
          This list is meant as a way to provide a straightforward curriculum of
          what you need to learn for development. It's updated constantly, but
          at any given point in time, I believe this is the best way to get
          started with, and learn everything you need to know to work with the
          web and beyond.
        </P>
        <P>
          These <span class="text-warning">{totalCourseCount} courses</span>{" "}
          will take a while to get through, so I recommend signing up for Pro
          accounts instead of buying one-time courses. I've optimized the list
          to focus on one platform at a time. When there is a series of Udemy
          courses, sign up for Udemy Pro, cancel it when you're done, and so on.
        </P>
        <div class="my-6">
          <CoursesContainer />
        </div>
      </div>
    </MainLayout>
  );
};
