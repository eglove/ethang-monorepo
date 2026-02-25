import get from "lodash/get.js";
import { DateTime } from "luxon";

import { coursePathData } from "../../stores/course-path-store.ts";
import { globalStore } from "../../stores/global-store-properties.ts";
import { CoursesContainer } from "../courses/courses-container.tsx";
import { MainLayout } from "../layouts/main-layout.tsx";

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
      description="A curated list of recommended courses for development. Learn from industry experts and stay up-to-date with the latest technologies."
      imageUrl="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    >
      <div class="mx-auto max-w-7xl">
        <div class="format max-w-none format-invert">
          <h1>Recommended Courses</h1>
          <p>Last Updated: {formatted}</p>
          <p>
            This list is meant as a way to provide a straightforward curriculum
            of what you need to learn for development. It's updated constantly,
            but at any given point in time, I believe this is the best way to
            get started with, and learn everything you need to know to work with
            the web and beyond.
          </p>
          <p>
            These <span class="text-warning">{totalCourseCount} courses</span>{" "}
            will take a while to get through, so I recommend signing up for Pro
            accounts instead of buying one-time courses. I've optimized the list
            to focus on one platform at a time. When there is a series of Udemy
            courses, sign up for Udemy Pro, cancel it when you're done, and so
            on.
          </p>
        </div>
        <div class="my-6">
          <CoursesContainer />
        </div>
      </div>
    </MainLayout>
  );
};
