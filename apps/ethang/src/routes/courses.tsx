import { Card, CardBody, CardHeader, Chip, Link } from "@heroui/react";
import map from "lodash/map.js";
import { SquareArrowOutUpRight } from "lucide-react";

import { MainLayout } from "../components/main-layout.tsx";
import { TypographyH1 } from "../components/typography/typography-h1.tsx";
import { TypographyH2 } from "../components/typography/typography-h2.tsx";
import { TypographyP } from "../components/typography/typography-p.tsx";
import {
  courseStore,
  knowledgeArea,
  knowledgeAreasKeys,
} from "../stores/course-store.ts";

const formatter = Intl.NumberFormat(undefined, {
  minimumIntegerDigits: 2,
});

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
      <div className="my-4 grid gap-4 sm:grid-cols-[auto_1fr]">
        <Card className="max-h-max">
          <CardHeader>
            <TypographyH2>Knowledge Areas</TypographyH2>
          </CardHeader>
          <CardBody className="grid max-h-max gap-2">
            {map(knowledgeAreasKeys, (key) => {
              return (
                <div className="flex justify-between gap-2">
                  <p className="text-sm text-wrap text-clip">
                    {knowledgeArea[key]}
                  </p>
                  <Chip size="sm">
                    {courseStore.getKnowledgeAreaCount(key)}
                  </Chip>
                </div>
              );
            })}
          </CardBody>
        </Card>
        <div className="grid gap-4">
          {map(courseStore.courseData, (data, index) => {
            const authorPlatform =
              data.author === data.platform
                ? data.author
                : `${data.author}, ${data.platform}`;

            return (
              <Card
                as={Link}
                isExternal
                href={data.url}
                key={data.name}
                className="cursor-pointer border-2 border-background hover:border-primary"
              >
                <CardBody className="grid grid-cols-[auto_1fr] gap-2">
                  <p className="leading-7">{formatter.format(index + 1)}.</p>
                  <div>
                    <TypographyP className="flex items-center gap-2 font-bold">
                      {data.name} <SquareArrowOutUpRight size="16" />
                    </TypographyP>
                    <p className="leading-7">{authorPlatform}</p>
                    <div className="my-2 flex flex-wrap gap-2">
                      {map(data.knowledgeAreas, (area) => {
                        return (
                          <Chip
                            size="sm"
                            key={area}
                            variant="flat"
                            color="primary"
                          >
                            {knowledgeArea[area]}
                          </Chip>
                        );
                      })}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export const Route = createFileRoute({
  component: RouteComponent,
});
