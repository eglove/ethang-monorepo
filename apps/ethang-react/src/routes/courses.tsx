import {
  Badge,
  Card,
  Flex,
  Heading,
  Link,
  Spinner,
  Text
} from "@radix-ui/themes";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map";
import reduce from "lodash/reduce";
import { DateTime } from "luxon";
import { useMemo } from "react";
import LiteYouTubeEmbed from "react-lite-youtube-embed";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";

import { MainLayout } from "../components/layout/main-layout.tsx";
import { getCourses } from "../models/courses-model.ts";

const swebokFocusMap = new Map([
  ["architecture", "Software Architecture"],
  ["certification", "Certification"],
  ["computing", "Computing Foundations"],
  ["construction", "Software Construction"],
  ["design", "Software Design"],
  ["economics", "Software Engineering Economics"],
  ["engineering-operations", "Software Engineering Operations"],
  ["engineering", "Engineering Foundations"],
  ["maintenance", "Software Maintenance"],
  ["management", "Software Engineering Management"],
  ["mathematical", "Mathematical Foundations"],
  ["models-methods", "Software Engineering Models and Methods"],
  ["process", "Software Engineering Process"],
  ["professional-practice", "Software Engineering Professional Practice"],
  ["quality", "Software Quality"],
  ["requirements", "Software Requirements"],
  ["scm", "Software Configuration Management"],
  ["security", "Software Security"],
  ["testing", "Software Testing"]
]);

const RouteComponent = () => {
  const { data, isPending } = useQuery(getCourses());

  const hasData = !isPending && !isNil(data?.learningPaths);

  const formattedDate = isNil(data?.latestUpdate._updatedAt)
    ? ""
    : DateTime.fromISO(data.latestUpdate._updatedAt).toLocaleString({
        dateStyle: "medium",
        timeStyle: "long"
      });

  const pathOffsets = useMemo(() => {
    return reduce(
      data?.learningPaths ?? [],
      (accumulator, path) => {
        const offset = accumulator.at(-1) ?? 0;
        accumulator.push(offset + path.courseCount);
        return accumulator;
      },
      [0] as number[]
    );
  }, [data?.learningPaths]);

  return (
    <MainLayout>
      <Heading mb="2" as="h1" size="8">
        Recommended Courses
      </Heading>
      {formattedDate && (
        <Text as="p" mb="4">
          Last Updated: {formattedDate}
        </Text>
      )}
      <LiteYouTubeEmbed
        lazyLoad
        id="5uxDJJdl_jA"
        title="EthanG | Recommended Courses"
      />
      {!hasData && (
        <Flex my="6" justify="center">
          <Spinner size="3" />
        </Flex>
      )}
      {hasData && (
        <Flex my="6" gap="4" direction="column">
          {map(data.learningPaths, (path, pathIndex) => {
            return (
              <Card key={path._id}>
                <Flex gap="3" wrap="wrap" align="center">
                  <Heading as="h2" size="5">
                    {isNil(path.url) ? (
                      path.name
                    ) : (
                      <Link
                        href={path.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {path.name}
                      </Link>
                    )}
                  </Heading>
                  <Badge variant="soft">
                    {swebokFocusMap.get(path.swebokFocus) ?? path.swebokFocus}
                  </Badge>
                </Flex>
                <Text as="p" mb="3" mt="1" color="gray">
                  {path.courseCount}{" "}
                  {1 === path.courseCount ? "course" : "courses"}
                </Text>
                <Flex asChild gap="1" direction="column">
                  <ul>
                    {map(path.courses, (course, index) => {
                      return (
                        <li key={course._id}>
                          <Text as="span">
                            {get(pathOffsets, pathIndex, 0) + index + 1}.{" "}
                          </Text>
                          <Link
                            target="_blank"
                            href={course.url}
                            rel="noopener noreferrer"
                          >
                            {course.name}
                          </Link>
                          <Text as="span" color="gray">
                            {" "}
                            by {course.author}
                          </Text>
                        </li>
                      );
                    })}
                  </ul>
                </Flex>
              </Card>
            );
          })}
        </Flex>
      )}
    </MainLayout>
  );
};

export const Route = createFileRoute("/courses")({
  component: RouteComponent
});
