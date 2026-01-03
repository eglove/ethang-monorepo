import {
  Accordion,
  AccordionItem,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
} from "@heroui/react";
import map from "lodash/map.js";

import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";
import { TypographyP } from "../components/typography/typography-p.tsx";
import { courseStore, knowledgeArea } from "../stores/course-store.ts";

const RouteComponent = () => {
  return (
    <MainLayout className="max-w-[64ch]">
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
      <Accordion>
        {map(courseStore.courseData, (data, index) => {
          const authorPlatform =
            data.author === data.platform
              ? data.author
              : `${data.author}, ${data.platform}`;

          return (
            <AccordionItem
              key={data.name}
              aria-label={data.name}
              title={`${index + 1}. ${data.name}`}
              classNames={{ trigger: "cursor-pointer" }}
            >
              <Card className="bg-background">
                <CardHeader className="pt-0">
                  <p className="leading-7">{authorPlatform}</p>
                </CardHeader>
                <CardBody>
                  <TypographyP>{data.description}</TypographyP>
                </CardBody>
                <CardFooter className="flex flex-wrap gap-2 pb-0">
                  {map(data.knowledgeAreas, (area) => {
                    return (
                      <Chip key={area} variant="flat" color="primary">
                        {knowledgeArea[area]}
                      </Chip>
                    );
                  })}
                </CardFooter>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
