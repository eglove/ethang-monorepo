import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Link,
} from "@heroui/react";
import isNil from "lodash/isNil";
import map from "lodash/map";

import type { projectList } from "./project-list.ts";

import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH2 } from "../typography/typography-h2.tsx";

type ProjectCardProperties = {
  project: (typeof projectList)[number];
};

export const ProjectCard = ({ project }: Readonly<ProjectCardProperties>) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <TypographyH2>{project.title}</TypographyH2>
      </CardHeader>
      <CardBody>
        <div className="grid gap-5 h-full">
          <p className="text-foreground-500">{project.description}</p>
          <div className="flex flex-wrap gap-2 self-end">
            {map(project.tech, (tech) => {
              return <Chip>{tech}</Chip>;
            })}
          </div>
        </div>
      </CardBody>
      <CardFooter className="gap-4">
        <Button
          isExternal
          as={Link}
          className="bg-black text-white border-1 border-white"
          href={project.code}
        >
          <GithubIcon className="size-4" /> Code
        </Button>
        {!isNil(project.publicUrl) && (
          <Button
            isExternal
            showAnchorIcon
            as={Link}
            className="bg-white text-black border-1 border-black"
            href={project.publicUrl}
          >
            Site
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
