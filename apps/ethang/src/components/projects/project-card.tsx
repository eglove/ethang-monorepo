import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Link,
} from "@heroui/react";
import { PortableText } from "@portabletext/react";
import { useQuery } from "@tanstack/react-query";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import convertToString from "lodash/toString.js";

import { getProject } from "../../sanity/queries.ts";
import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH2 } from "../typography/typography-h2.tsx";

type ProjectCardProperties = {
  id: string;
};

export const ProjectCard = ({ id }: Readonly<ProjectCardProperties>) => {
  const { data } = useQuery(getProject(id));

  return (
    <Card className="border-2">
      <CardHeader>
        <TypographyH2>
          {convertToString(get(data, ["title"], "Loading..."))}
        </TypographyH2>
      </CardHeader>
      <CardBody>
        <div className="grid h-full gap-5 [&>p]:text-foreground-500">
          <PortableText value={get(data, ["description"], [])}></PortableText>
          <div className="flex flex-wrap gap-2 self-end">
            {map(
              data?.techs.toSorted((a, b) => {
                return convertToString(get(b, ["name"], "")).localeCompare(
                  convertToString(get(a, ["name"], "")),
                );
              }),
              (tech) => {
                return (
                  <Chip key={get(tech, ["_id"])}>{get(tech, ["name"])}</Chip>
                );
              },
            )}
          </div>
        </div>
      </CardBody>
      <CardFooter className="gap-4">
        {!isNil(data) && (
          <Button
            as={Link}
            isExternal
            href={convertToString(get(data, ["githubUrl"], ""))}
            className="border-1 border-white bg-black text-white"
          >
            <GithubIcon className="size-4" /> Code
          </Button>
        )}
        {!isNil(get(data, ["publicUrl"])) && (
          <Button
            as={Link}
            isExternal
            showAnchorIcon
            href={convertToString(get(data, ["publicUrl"], ""))}
            className="border-1 border-black bg-white text-black"
          >
            Site
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
