import { ContentHandler } from "@/components/common/content-handler.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyLink } from "@/components/typography/typography-link.tsx";
import { TypographyList } from "@/components/typography/typography-list.tsx";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import isEmpty from "lodash/isEmpty.js";
import map from "lodash/map.js";

import { MainLayout } from "../components/layouts/main-layout";
import { SanityContent } from "../components/sanity/sanity-content";
import { recommendedCoursesQuery } from "../query/recommended-courses";

const Courses = () => {
  const {
    data, error, isError, isPending,
  } = useQuery(recommendedCoursesQuery());

  return (
    <MainLayout>
      <ContentHandler
        isEmpty={() => {
          return isEmpty(data);
        }}
        emptyPlaceholder="Nothing found"
        error={error}
        isError={isError}
        isLoading={isPending}
      >
        <TypographyH1 className="my-4">
          {data?.title}
        </TypographyH1>
        <SanityContent
          styleNames="max-w-max"
          value={data?.description ?? []}
        />
        <Accordion
          collapsible
          type="single"
        >
          {map(data?.courseSections, (section) => {
            return (
              <AccordionItem value={section._id}>
                <AccordionTrigger>
                  <TypographyH3>
                    {section.title}
                  </TypographyH3>
                </AccordionTrigger>
                <AccordionContent>
                  <SanityContent value={section.description} />
                  <TypographyList
                    items={map(section.courses, (course) => {
                      return (
                        <TypographyLink
                          href={course.url}
                        >
                          {course.name}
                        </TypographyLink>
                      );
                    })}
                    className="list-decimal"
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ContentHandler>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/courses")({
  component: Courses,
});
