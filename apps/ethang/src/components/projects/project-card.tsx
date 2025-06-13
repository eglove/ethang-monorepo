import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Link,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import find from "lodash/find";
import isNil from "lodash/isNil";
import map from "lodash/map";

import { GithubIcon } from "../svg/github-icon.tsx";
import { TypographyH2 } from "../typography/typography-h2.tsx";
import { projectStore } from "./project-store.ts";

type ProjectCardProperties = {
  id: string;
};

export const ProjectCard = ({ id }: Readonly<ProjectCardProperties>) => {
  const { data: project } = useQuery({
    ...projectStore.getProjects(),
    select: (_data) => {
      return find(_data.projects, { id });
    },
  });

  return (
    <Card className="border-2">
      <CardHeader>
        <TypographyH2>{project?.title}</TypographyH2>
      </CardHeader>
      <CardBody>
        <div className="grid gap-5 h-full">
          <p className="text-foreground-500">{project?.description}</p>
          <div className="flex flex-wrap gap-2 self-end">
            {map(
              project?.techs.sort((a, b) => b.name.localeCompare(a.name)),
              (tech) => {
                return <Chip key={tech.id}>{tech.name}</Chip>;
              },
            )}
          </div>
        </div>
      </CardBody>
      <CardFooter className="gap-4">
        {!isNil(project) && (
          <Button
            isExternal
            as={Link}
            className="bg-black text-white border-1 border-white"
            href={project.code}
          >
            <GithubIcon className="size-4" /> Code
          </Button>
        )}
        {!isNil(project?.publicUrl) && (
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
