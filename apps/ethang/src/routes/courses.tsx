import { useStore } from "@ethang/store/use-store";
import {
  Accordion,
  AccordionItem,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Link,
} from "@heroui/react";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { twMerge } from "tailwind-merge";

import {
  academindCourseData,
  bonusCourseData,
  coltSteeleCourseData,
  frontendMastersCourseData,
  readingCourseData,
  swebokCourseData,
} from "../components/courses/course-list-data.ts";
import { CourseListItem } from "../components/courses/course-list-item.tsx";
import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";
import { TypographyH2 } from "../components/typography/typography-h2.tsx";
import { TypographyP } from "../components/typography/typography-p.tsx";
import {
  courseStore,
  knowledgeArea,
  knowledgeAreasKeys,
} from "../stores/course-store.ts";

const accordionClassnames = { trigger: "cursor-pointer" };

const RouteComponent = () => {
  const selectedKnowledgeArea = useStore(courseStore, (state) => {
    return state.selectedKnowledgeArea;
  });

  const filteredCourseData = isNil(selectedKnowledgeArea)
    ? courseStore.courseData
    : filter(courseStore.courseData, (course) => {
        return includes(course.knowledgeAreas, selectedKnowledgeArea);
      });

  return (
    <MainLayout>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <div className="hidden sm:block">
          <TypographyH2 className="mb-2 text-center">
            Knowledge Areas
          </TypographyH2>
          <Card>
            <CardBody className="grid gap-2">
              {map(knowledgeAreasKeys, (key) => {
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    className={twMerge(
                      "grid min-h-12 grid-cols-[1fr_auto] gap-4",
                      selectedKnowledgeArea === key && "bg-foreground-200",
                    )}
                    onPress={() => {
                      if (key === selectedKnowledgeArea) {
                        courseStore.setSelectedKnowledgeArea(null);
                      } else {
                        courseStore.setSelectedKnowledgeArea(key);
                      }
                    }}
                  >
                    <div className="max-w-64 text-wrap">
                      {knowledgeArea[key]}
                    </div>
                    <Chip variant="faded">
                      {courseStore.getKnowledgeAreaCount(key)}
                    </Chip>
                  </Button>
                );
              })}
            </CardBody>
          </Card>
        </div>
        <div>
          <TypographyH2 className="mb-2 text-center">Courses</TypographyH2>
          <div className="grid gap-4">
            {map(filteredCourseData, (data) => {
              return (
                <Card key={data.name}>
                  <CardHeader className="grid">
                    <div className="text-2xl font-bold">{data.name}</div>
                    <p className="leading-7 text-secondary">{data.author}</p>
                  </CardHeader>
                  <CardBody>
                    <TypographyP>{data.description}</TypographyP>
                    <TypographyP>
                      <Link isExternal showAnchorIcon href={data.url}>
                        Go to Course
                      </Link>
                    </TypographyP>
                  </CardBody>
                  <CardFooter className="flex flex-wrap gap-2 border-t-1">
                    {map(data.knowledgeAreas, (area) => {
                      return (
                        <Chip key={area} variant="flat" color="primary">
                          {knowledgeArea[area]}
                        </Chip>
                      );
                    })}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
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
        signing up for Pro accounts instead of buying one-time courses. So in
        the beginner section, check out Udemy Pro. Keep going with Udemy Pro for
        Academind's courses. Once you're through those, cancel it, move on to
        the next platform, and so on.
      </TypographyP>
      <Accordion>
        <AccordionItem
          key="1"
          title="Beginner: Colt Steele"
          classNames={accordionClassnames}
          aria-label="Beginner: Colt Steele"
        >
          <CourseListItem courseList={coltSteeleCourseData}>
            <TypographyP>
              I believe Colt Steele is the most beginner-friendly instructor out
              there. He's interesting, knowledgeable, and approaches topics in
              an easy-to-digest way. Colt Steele has brought his developer
              bootcamp to Udemy and continues to update it every year with
              modern technology.
            </TypographyP>
            <TypographyP>
              <Link
                isExternal
                underline="always"
                className="text-foreground"
                href="https://www.udemy.com/user/coltsteele/"
              >
                Colt Steele courses
              </Link>
            </TypographyP>
            <TypographyP>
              Take as many of his courses as you like, but at a minimum, I
              highly recommend taking these:
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          key="2"
          classNames={accordionClassnames}
          title="Learn to Build: Academind"
          aria-label="Learn to Build: Academind"
        >
          <CourseListItem courseList={academindCourseData}>
            <TypographyP>
              Academind has long been a great source for following along with
              projects for multiple frameworks. Which is an excellent way to get
              an introduction to all of a frameworks features.
            </TypographyP>
            <TypographyP>
              Academind has its own paid subscription, but most, if not all, the
              courses are also available on Udemy. I recommend going through
              their learning paths, but take as many courses as you like:
            </TypographyP>
            <TypographyP>
              <Link
                isExternal
                underline="always"
                className="text-foreground"
                href="https://academind.com/"
              >
                Academind
              </Link>
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          key="3"
          classNames={accordionClassnames}
          title="Learn the Web: Frontend Masters"
          aria-label="Learn the Web: Frontend Masters"
        >
          <CourseListItem courseList={frontendMastersCourseData}>
            <TypographyP>
              Frontend Masters has world-class instructors leading lecture style
              workshops on just about everything.
            </TypographyP>
            <TypographyP>
              I recommend simply just following the learning paths, even the
              beginner and professional paths that will feel below your skill
              level at this point. There is still a lot of good to pick up.
              However, I would avoid the framework courses (React/Angular/Vue).
              Frontend Masters and its community is notably anti-framework. This
              isn't the place you want to learn about industry tooling. But
              their deep dives into vanilla tech will make you a better user of
              frameworks.
            </TypographyP>
            <TypographyP>
              <Link
                isExternal
                underline="always"
                className="text-foreground"
                href="https://frontendmasters.com/learn/"
              >
                Frontend Masters
              </Link>
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          key="5"
          classNames={accordionClassnames}
          title="Become an Engineer: IEEE"
          aria-label="Become an Engineer: IEEE"
        >
          <CourseListItem courseList={swebokCourseData}>
            <TypographyP>
              Learn how to go beyond just programming and code and become an
              engineer. IEEE SWEBOK certifications cover official industry
              standards for things like software requirement engineering,
              design, construction, testing, operations, maintenance,
              configuration management, engineering management, engineering
              process, quality, security, professional practice, economics, and
              more.
            </TypographyP>
            <TypographyP>
              If you're serious enough about engineering to start getting
              through the dry content and taking ownership in large scale
              systems, this is the place to start.
            </TypographyP>
            <TypographyP>
              These courses and certifications are based on the{" "}
              <Link
                isExternal
                color="foreground"
                underline="always"
                href="https://www.computer.org/education/bodies-of-knowledge/software-engineering"
              >
                Software Engineer Body of Knowledge (SWEBOK)
              </Link>
              .
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          key="6"
          title="Bonus"
          aria-label="Bonus"
          classNames={accordionClassnames}
        >
          <CourseListItem courseList={bonusCourseData}>
            <TypographyP>
              For the most part, I recommend avoiding courses that charge too
              much money. $300 is way too much. Part of the reason I recommended
              Academind is they've kept reasonable pricing in an environment
              where instructors expect to pump out low quality courses at the
              end of the year targeting "use it or lose it" company stipends.
            </TypographyP>
            <TypographyP>
              The following courses are entirely optional but recommended due to
              a quality unmatched. But the pricing may be too much.
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          key="7"
          title="Reading"
          aria-label="Reading"
          classNames={accordionClassnames}
        >
          <CourseListItem courseList={readingCourseData}>
            <TypographyP>
              Below is a simple recommended reading list to get to at your
              leisure. Just a few books I've found and would recommend.
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
      </Accordion>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
