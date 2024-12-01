import { TypographyH3 } from "@ethang/react-components/src/components/typography/typography-h3.tsx";
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

type JobDetailsProperties = {
  job: (typeof api.jobs.getAll._returnType)[0];
};

// @ts-expect-error exists
// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-type-assertion
const listFormatter = new Intl.ListFormat(undefined, {
  type: "unit",
}) as { format: (values: string[]) => string };

export const JobDetails = ({ job }: Readonly<JobDetailsProperties>) => {
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
            {job.title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {job.description}
        </DialogDescription>
        <TypographyH3>
          Tech Used
        </TypographyH3>
        <TypographyP className="!mt-0">
          {listFormatter.format(job.technologiesUsed)}
        </TypographyP>
        <TypographyH3>
          Methodologies Used
        </TypographyH3>
        <TypographyP className="!mt-0">
          {listFormatter.format(job.methodologiesUsed)}
        </TypographyP>
      </DialogContent>
    </Dialog>
  );
};
