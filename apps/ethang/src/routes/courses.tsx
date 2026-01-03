import { useStore } from "@ethang/store/use-store";
import { Button, Card, CardBody, CardHeader, Chip, Link } from "@heroui/react";
import filter from "lodash/filter.js";
import includes from "lodash/includes.js";
import isNil from "lodash/isNil.js";
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
  const selected = useStore(courseStore, (state) => {
    return state.selectedKnowledgeArea;
  });

  const filteredData = filter(courseStore.courseData, (data) => {
    if (isNil(selected)) {
      return true;
    }

    return includes(data.knowledgeAreas, selected);
  });

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
      <div className="my-4 grid items-start gap-4 sm:grid-cols-[auto_1fr]">
        <Card className="sticky top-16 max-h-max">
          <CardHeader>
            <TypographyH2>Knowledge Areas</TypographyH2>
          </CardHeader>
          <CardBody className="grid max-h-max gap-1">
            {map(knowledgeAreasKeys, (key) => {
              return (
                <Button
                  key={key}
                  size="sm"
                  variant="flat"
                  className="flex justify-between gap-2"
                  color={key === selected ? "primary" : "default"}
                  onPress={() => {
                    if (key === selected) {
                      courseStore.setSelectedKnowledgeArea(null);
                    } else {
                      courseStore.setSelectedKnowledgeArea(key);
                    }
                  }}
                >
                  <p className="text-sm text-wrap text-clip">
                    {knowledgeArea[key]}
                  </p>
                  <Chip size="sm">
                    {courseStore.getKnowledgeAreaCount(key)}
                  </Chip>
                </Button>
              );
            })}
          </CardBody>
        </Card>
        <div className="grid gap-4">
          {map(filteredData, (data) => {
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
                className="max-h-max cursor-pointer border-2 border-background hover:border-primary"
              >
                <CardBody className="grid grid-cols-[auto_1fr] gap-2">
                  <p className="leading-7">
                    {formatter.format(
                      courseStore.getCourseIndex(data.name) + 1,
                    )}
                    .
                  </p>
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
