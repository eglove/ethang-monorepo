import type { Job } from "@/query/job.ts";

import { SanityContent } from "@/components/sanity/sanity-content.tsx";
import { TypographyH2 } from "@/components/typography/typography-h2.tsx";
import { TypographyH3 } from "@/components/typography/typography-h3.tsx";
import { TypographyP } from "@/components/typography/typography-p.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "@/components/ui/dialog.tsx";
import map from "lodash/map";
import { EyeIcon } from "lucide-react";

type JobDetailsProperties = {
  job: Job;
};

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
          <TypographyH2>
            {job.title}
          </TypographyH2>
        </DialogHeader>
        <DialogDescription>
          <SanityContent value={job.description} />
        </DialogDescription>
        <TypographyH3>
          Tech Used
        </TypographyH3>
        <TypographyP className="!mt-0">
          {listFormatter.format(map(job.techUsed, "name"))}
        </TypographyP>
        <TypographyH3>
          Methodologies Used
        </TypographyH3>
        <TypographyP className="!mt-0">
          {listFormatter.format(map(job.methodologiesUsed, "name"))}
        </TypographyP>
      </DialogContent>
    </Dialog>
  );
};
