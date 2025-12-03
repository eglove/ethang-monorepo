import { Accordion, AccordionItem, Link } from "@heroui/react";

import {
  academindCourseData,
  bonusCourseData,
  coltSteeleCourseData,
  frontendMastersCourseData,
  readingCourseData,
  swebokCourseData,
  zeroToMasteryCourseData,
} from "../components/courses/course-list-data.ts";
import { CourseListItem } from "../components/courses/course-list-item.tsx";
import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";
import { TypographyP } from "../components/typography/typography-p.tsx";

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[65ch]">
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
          aria-label="Beginner: Colt Steele"
          key="1"
          title="Beginner: Colt Steele"
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
                className="text-foreground"
                href="https://www.udemy.com/user/coltsteele/"
                underline="always"
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
          aria-label="Learn to Build: Academind"
          key="2"
          title="Learn to Build: Academind"
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
                className="text-foreground"
                href="https://academind.com/"
                underline="always"
              >
                Academind
              </Link>
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          aria-label="Learn the Web: Frontend Masters"
          key="3"
          title="Learn the Web: Frontend Masters"
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
                className="text-foreground"
                href="https://frontendmasters.com/learn/"
                underline="always"
              >
                Frontend Masters
              </Link>
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          aria-label="Broaden Your SkillSet: Zero to Mastery"
          key="4"
          title="Broaden Your SkillSet: Zero to Mastery"
        >
          <CourseListItem courseList={zeroToMasteryCourseData}>
            <TypographyP>
              Through sheer quantity, Zero to Mastery is a great resource to
              keep your learning going. The quality of instructor here starts to
              degrade compared to previous courses, the content is very well put
              together.
            </TypographyP>
            <TypographyP>
              <Link
                isExternal
                className="text-foreground"
                href="https://zerotomastery.io/"
                underline="always"
              >
                Zero to Mastery
              </Link>
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem
          aria-label="Become an Engineer: IEEE"
          key="5"
          title="Become an Engineer: IEEE"
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
                href="https://www.computer.org/education/bodies-of-knowledge/software-engineering"
                underline="always"
              >
                Software Engineer Body of Knowledge (SWEBOK)
              </Link>
              .
            </TypographyP>
          </CourseListItem>
        </AccordionItem>
        <AccordionItem aria-label="Bonus" key="6" title="Bonus">
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
        <AccordionItem aria-label="Reading" key="7" title="Reading">
          <CourseListItem courseList={readingCourseData}>
            <TypographyP>
              Of the below list, the only item I would say is an absolute
              requirement is SWEBOK. Learning and certifying in SWEBOK is the
              difference between a software developer and software engineer. The
              rest are recommended publishers and authors to keep track of,
              browse at your leisure.
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
