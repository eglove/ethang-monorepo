import { CourseAccordion } from "../components/courses/course-accordion.tsx";
import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";
import { TypographyP } from "../components/typography/typography-p.tsx";

const RouteComponent = () => {
  return (
    <MainLayout>
      <TypographyH1>Recommended Courses</TypographyH1>
      <TypographyP>
        This list is meant as a way to provide a straightforward curriculum of
        what you need to learn for development. It's updated constantly, but at
        any given point in time, I believe this is the best way to get started
        with, and learn everything you need to know to work with the web and
        beyond.
      </TypographyP>
      <TypographyP>
        These courses will take a while to get through, so I do recommend
        signing up for Pro accounts instead of buying one-time courses. I've
        optimized the list to focus on one platform at a time. When there is a
        series of Udemy courses, sign up for Udemy Pro, cancel it when your
        done, and so on.
      </TypographyP>

      <CourseAccordion />
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
