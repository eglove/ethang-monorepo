import { useQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { twMerge } from "tailwind-merge";

import { CoursesContainer } from "../components/courses/courses-container.tsx";
import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";
import { TypographyP } from "../components/typography/typography-p.tsx";
import { getCourseCount, getLatestUpdate } from "../sanity/queries.ts";
import { createHead } from "../util/create-head.ts";

const RouteComponent = () => {
  const { data } = useQuery(getCourseCount());
  const { data: latestUpdate } = useQuery(getLatestUpdate());

  return (
    <MainLayout>
      <TypographyH1>Recommended Courses</TypographyH1>
      <TypographyP>
        Last Updated:{" "}
        {!isNil(latestUpdate?._updatedAt) &&
          new Date(latestUpdate._updatedAt).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
          })}
      </TypographyP>
      <TypographyP>
        This list is meant as a way to provide a straightforward curriculum of
        what you need to learn for development. It's updated constantly, but at
        any given point in time, I believe this is the best way to get started
        with, and learn everything you need to know to work with the web and
        beyond.
      </TypographyP>
      <TypographyP>
        These{" "}
        <span className={twMerge(!isNil(data) && "text-warning")}>
          {data ?? ""} courses
        </span>{" "}
        will take a while to get through, so I recommend signing up for Pro
        accounts instead of buying one-time courses. I've optimized the list to
        focus on one platform at a time. When there is a series of Udemy
        courses, sign up for Udemy Pro, cancel it when you're done, and so on.
      </TypographyP>

      <CoursesContainer />
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
  head: createHead({
    description:
      "A curated list of recommended courses for development. Learn from industry experts and stay up-to-date with the latest technologies.",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    title: "Recommended Courses",
  }),
});
