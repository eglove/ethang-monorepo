import type { Project } from "@/query/projects.ts";

import { SanityContent } from "@/components/sanity/sanity-content.tsx";
import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { TypographyLink } from "@/components/typography/typography-link.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog.tsx";
import { EyeIcon } from "lucide-react";

type ProjectDetailsProperties = {
  project: Project;
};

export const ProjectDetails = ({
  project,
}: Readonly<ProjectDetailsProperties>) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          aria-label="View Details"
          size="sm"
          variant="ghost"
        >
          <EyeIcon />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <TypographyH2>
            {project.name}
          </TypographyH2>
        </DialogHeader>
        <DialogDescription>
          <SanityContent value={project.description} />
        </DialogDescription>
        <TypographyP>
          <TypographyLink
            href={project.url}
          >
            {project.url}
          </TypographyLink>
        </TypographyP>
      </DialogContent>
    </Dialog>
  );
};
