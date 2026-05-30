import { useQuery as useApolloQuery } from "@apollo/client/react";
import { gql } from "@ethang/graphql-types/__generated__";
import {
  Badge,
  Card,
  Flex,
  Heading,
  Link,
  Spinner,
  Text
} from "@radix-ui/themes";
import { createFileRoute } from "@tanstack/react-router";
import first from "lodash/first.js";
import flatMap from "lodash/flatMap.js";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map";
import orderBy from "lodash/orderBy.js";
import "react-lite-youtube-embed/dist/LiteYouTubeEmbed.css";
import reduce from "lodash/reduce";
import { DateTime } from "luxon";
import { useMemo } from "react";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { MainLayout } from "../components/layout/main-layout.tsx";

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
  const { data: result, loading } = useApolloQuery(
    gql(`
    query GetCourses {
      learningPaths {
        id
        name
        url
        swebokFocus
        courses {
          id
          name
          url
          author
          updatedAt
        }
      }
    }
  `)
  );

  const hasData = !loading && !isNil(result?.learningPaths);

  const latestUpdate = first(
    orderBy(
      flatMap(result?.learningPaths, (path) => {
        return path.courses;
      }),
      ["updatedAt"],
      "desc"
    )
  );

  const formattedDate = isNil(latestUpdate)
    ? ""
    : DateTime.fromISO(latestUpdate.updatedAt).toLocaleString({
        dateStyle: "medium",
        timeStyle: "long"
      });

  const pathOffsets = useMemo(() => {
    return reduce(
      result?.learningPaths ?? [],
      (accumulator, path) => {
        const offset = accumulator.at(-1) ?? 0;
        accumulator.push(offset + path.courses.length);
        return accumulator;
      },
      [0] as number[]
    );
  }, [result?.learningPaths]);

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
          {map(result.learningPaths, (path, pathIndex) => {
            return (
              <Card key={path.id}>
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
                  {path.courses.length}{" "}
                  {1 === path.courses.length ? "course" : "courses"}
                </Text>
                <Flex asChild gap="1" direction="column">
                  <ul>
                    {map(path.courses, (course, index) => {
                      return (
                        <li key={course.id}>
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
