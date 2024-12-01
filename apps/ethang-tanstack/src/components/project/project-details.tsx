import { TypographyLink } from "@ethang/react-components/src/components/typography/typography-link.tsx";
import { TypographyP } from "@ethang/react-components/src/components/typography/typography-p.tsx";
import { Button } from "@ethang/react-components/src/components/ui/button.tsx";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@ethang/react-components/src/components/ui/dialog.tsx";
import { EyeIcon } from "lucide-react";

import type { api } from "../../../convex/_generated/api";

type ProjectDetailsProperties = {
  project: (typeof api.project.getAll._returnType)[0];
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
          <DialogTitle>
            {project.name}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {project.description}
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
