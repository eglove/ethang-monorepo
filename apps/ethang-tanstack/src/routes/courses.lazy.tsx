import { ContentHandler } from "@/components/common/content-handler.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyLink } from "@/components/typography/typography-link.tsx";
import { TypographyList } from "@/components/typography/typography-list.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import get from "lodash/get.js";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";

import { api } from "../../convex/_generated/api";
import { MainLayout } from "../components/layouts/main-layout";

const Courses = () => {
  // @ts-expect-error beta
  const query = useQuery(convexQuery(api.courses.getCourses, {}));

  return (
    <MainLayout classNames={{ main: "max-w-prose" }}>
      <ContentHandler
        isEmpty={() => {
          return isEmpty(query.data);
        }}
        emptyPlaceholder="Nothing found"
        error={query.error}
        isError={query.isError}
        isLoading={query.isPending}
      >
        <TypographyH1 className="my-4">
          Recommended Courses
        </TypographyH1>
        <TypographyP>
          This list is meant as a way to provide a straightforward curriculum of
          what you need to learn for development. It's updated constantly, but
          at any given point in time, I believe this is the best way to get
          started with, and learn everything you need to know to work with the
          web and beyond.
        </TypographyP>
        <TypographyP>
          These courses will take a while to get through, so I do recommend
          signing up for Pro accounts instead of buying one-time courses. So in
          the beginner section, check out Udemy Pro. Keep going with Udemy Pro
          for Academind's courses. Once you're through those, cancel it, move on
          to the next platform, and so on.
        </TypographyP>
        <Accordion
          collapsible
          type="single"
        >
          <AccordionItem value={String(get(query, ["data", 0, "_id"], "0"))}>
            <AccordionTrigger>
              <TypographyH3>
                {get(query, ["data", 0, "title"])}
              </TypographyH3>
            </AccordionTrigger>
            <AccordionContent>
              <TypographyP>
                I believe Colt Steele is the most beginner-friendly instructor
                out there. He's interesting, knowledgeable, and approaches
                topics in an easy-to-digest way. Colt Steele has brought his
                developer bootcamp to Udemy and continues to update it every
                year with modern technology.
              </TypographyP>
              <TypographyP>
                <TypographyLink href="https://www.udemy.com/user/coltsteele/">
                  Colt Steele courses
                </TypographyLink>
              </TypographyP>
              <TypographyP>
                Take as many of his courses as you like, but at a minimum, I
                highly recommend taking these:
              </TypographyP>
              <TypographyList
                items={map(get(query, ["data", 0, "courses"], []), (course) => {
                  return (
                    <TypographyLink
                      href={course.url}
                      key={course.url}
                    >
                      {course.name}
                    </TypographyLink>
                  );
                })}
                className="list-decimal"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem
            value={String(get(query, ["data", 1, "_id"], "1"))}
          >
            <AccordionTrigger>
              <TypographyH3>
                {get(query, ["data", 1, "title"])}
              </TypographyH3>
            </AccordionTrigger>
            <AccordionContent>
              <TypographyP>
                Academind has long been a great source for following along with
                projects for multiple frameworks. Which is an excellent way to
                get an introduction to all of a frameworks features.
              </TypographyP>
              <TypographyP>
                Academind has its own paid subscription, but most, if not all,
                the courses are also available on Udemy. I recommend going
                through their learning paths, but take as many  courses as you
                like:
              </TypographyP>
              <TypographyP>
                <TypographyLink href="https://academind.com/">
                  Academind
                </TypographyLink>
              </TypographyP>
              <TypographyList
                items={map(get(query, ["data", 1, "courses"], []), (course) => {
                  return (
                    <TypographyLink
                      href={course.url}
                      key={course.url}
                    >
                      {course.name}
                    </TypographyLink>
                  );
                })}
                className="list-decimal"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value={String(get(query, ["data", 2, "_id"], "2"))}>
            <AccordionTrigger>
              <TypographyH3>
                {get(query, ["data", 2, "title"])}
              </TypographyH3>
            </AccordionTrigger>
            <AccordionContent>
              <TypographyP>
                Frontend Masters has world-class instructors leading lecture
                style workshops on just about everything.
              </TypographyP>
              <TypographyP>
                I recommend simply just following the learning paths, even
                the beginner and professional paths that will feel below your
                skill level at this point. There is still a lot of good to
                pick up. However, I would avoid the framework courses
                (React/Angular/Vue). Frontend Masters and its community is
                notably anti-framework. This isn't the place you want to learn
                about industry tooling. But their deep dives into vanilla tech
                will make you a better user of frameworks.
              </TypographyP>
              <TypographyP>
                <TypographyLink href="https://frontendmasters.com/learn/">
                  Frontend Masters
                </TypographyLink>
              </TypographyP>
              <TypographyList
                items={map(get(query, ["data", 2, "courses"], []), (course) => {
                  return (
                    <TypographyLink
                      href={course.url}
                      key={course.url}
                    >
                      {course.name}
                    </TypographyLink>
                  );
                })}
                className="list-decimal"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value={String(get(query, ["data", 3, "_id"], "5"))}>
            <AccordionTrigger>
              <TypographyH3>
                {get(query, ["data", 3, "title"])}
              </TypographyH3>
            </AccordionTrigger>
            <AccordionContent>
              <TypographyP>
                Through sheer quantity, Zero to Mastery is a great resource to
                keep your learning going. The quality of instructor here starts
                to degrade compared to previous courses, the content is very
                well put together.
              </TypographyP>
              <TypographyP>
                <TypographyLink href="https://zerotomastery.io/">
                  Zero to Mastery
                </TypographyLink>
              </TypographyP>
              <TypographyList
                items={map(get(query, ["data", 3, "courses"], []), (course) => {
                  return (
                    <TypographyLink
                      href={course.url}
                      key={course.url}
                    >
                      {course.name}
                    </TypographyLink>
                  );
                })}
                className="list-decimal"
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value={String(get(query, ["data", 4, "_id"], "3"))}>
            <AccordionTrigger>
              <TypographyH3>
                {get(query, ["data", 4, "title"])}
              </TypographyH3>
            </AccordionTrigger>
            <AccordionContent>
              <TypographyP>
                For the most part, I recommend avoiding courses that charge too
                much money. $300 is way too much. Part of the reason I
                recommended Academind is they've kept reasonable pricing in an
                environment where instructors expect to pump out low quality
                courses at the end of the year targeting "use it or lost it"
                company stipends.
              </TypographyP>
              <TypographyP>
                The following courses are entirely optional but recommended due
                to a quality unmatched. But the pricing may be too much.
              </TypographyP>
              <TypographyList items={map(get(query, ["data", 4, "courses"], []), (course) => {
                return (
                  <TypographyLink
                    href={course.url}
                    key={course.url}
                  >
                    {course.name}
                  </TypographyLink>
                );
              })}
              />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value={String(get(query, ["data", 5, "_id"], "4"))}>
            <AccordionTrigger>
              <TypographyH3>
                {get(query, ["data", 5, "title"])}
              </TypographyH3>
            </AccordionTrigger>
            <AccordionContent>
              <TypographyP>
                I always recommend keeping up to date with recently published
                books in the field. Here are my recommended publishers and
                authors:
              </TypographyP>
              <TypographyList items={map(get(query, ["data", 5, "courses"], []), (course) => {
                return (
                  <TypographyLink
                    href={course.url}
                    key={course.url}
                  >
                    {course.name}
                  </TypographyLink>
                );
              })}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ContentHandler>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/courses")({
  component: Courses,
});
