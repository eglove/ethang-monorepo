import { getContext } from "hono/context-storage";
import { html } from "hono/html";

import type { HonoContext } from "../index.ts";

import { coursesContainer } from "../components/courses/courses-container.tsx";
import { mainLayout } from "../components/layouts/main-layout.tsx";

const coursesComponent = async () => {
  const context = getContext<HonoContext>();
  const pageData = context.get("coursesPageData");

  return html`
    <article>
      <header><h1>Recommended Courses</h1></header>
      <p>Last Updated: ${pageData.lastUpdated}</p>
      <p>
        This list is meant as a way to provide a straightforward curriculum of
        what you need to learn for development. It’s updated constantly, but at
        any given point in time, I believe this is the best way to get started
        with and learn everything you need to know to work with the web and
        beyond.
      </p>
      <p>
        These
        <span class="pico-color-amber-250"
          >${pageData.totalCourseCount} courses</span
        >
        will take a while to get through, so I recommend signing up for Pro
        accounts instead of buying one-time courses. I’ve optimized the list to
        focus on one platform at a time. When there is a series of Udemy
        courses, sign up for Udemy Pro, cancel it when you’re done, and so on.
      </p>
      ${coursesContainer()}
    </article>
  `;
};

export const courses = async () => {
  return mainLayout({
    children: coursesComponent(),
    title: "EthanG | Courses",
  });
};
