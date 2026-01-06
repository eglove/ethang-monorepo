import { useQuery } from "@apollo/client/react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Link,
} from "@heroui/react";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import convertToString from "lodash/toString.js";

import {
  type GetProject,
  getProject,
  type Tech,
} from "../../graphql/projects.ts";
import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH2 } from "../typography/typography-h2.tsx";

type ProjectCardProperties = {
  id: string;
};

export const ProjectCard = ({ id }: Readonly<ProjectCardProperties>) => {
  const { data } = useQuery<GetProject>(getProject, {
    variables: { id },
  });

  const project = get(data, ["project"]);
  const techs = get(project, ["techs"]) ?? [];

  return (
    <Card className="border-2">
      <CardHeader>
        <TypographyH2>
          {convertToString(get(project, ["title"], "Loading..."))}
        </TypographyH2>
      </CardHeader>
      <CardBody>
        <div className="grid h-full gap-5">
          <p className="text-foreground-500">
            {convertToString(get(project, ["description"], ""))}
          </p>
          <div className="flex flex-wrap gap-2 self-end">
            {map(
              techs.toSorted((a: Tech, b: Tech) => {
                return convertToString(get(b, ["name"], "")).localeCompare(
                  convertToString(get(a, ["name"], "")),
                );
              }),
              (tech: Tech) => {
                return (
                  <Chip key={get(tech, ["id"])}>{get(tech, ["name"])}</Chip>
                );
              },
            )}
          </div>
        </div>
      </CardBody>
      <CardFooter className="gap-4">
        {!isNil(project) && (
          <Button
            as={Link}
            isExternal
            href={convertToString(get(project, ["code"], ""))}
            className="border-1 border-white bg-black text-white"
          >
            <GithubIcon className="size-4" /> Code
          </Button>
        )}
        {!isNil(get(project, ["publicUrl"])) && (
          <Button
            as={Link}
            isExternal
            showAnchorIcon
            className="border-1 border-black bg-white text-black"
            href={convertToString(get(project, ["publicUrl"], ""))}
          >
            Site
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
