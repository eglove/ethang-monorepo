import type { Dispatch, SetStateAction } from "react";

import { DownloadData } from "@/components/job-tracker/download-data";
import { Button } from "@/components/ui/button.tsx";
import { Link } from "@tanstack/react-router";

type JobTrackerTableFooterProperties = Readonly<{
  page: number;
  setPage: Dispatch<SetStateAction<number>>;
}>;

export const JobTrackerTableFooter = ({
  page,
  setPage,
}: JobTrackerTableFooterProperties) => {
  return (
    <div className="items-center my-4 flex justify-between">
      <div className="flex gap-4">
        <Button
          onClick={() => {
            setPage((previous) => {
              if (1 === previous) {
                return previous;
              }

              return previous - 1;
            });
          }}
          disabled={1 === page}
          size="sm"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            setPage((previous) => {
              return previous + 1;
            });
          }}
          size="sm"
          variant="outline"
        >
          Next
        </Button>
      </div>
      <div className="flex gap-4">
        <DownloadData />
        <Button asChild size="sm" variant="outline">
          <Link to="/import-data">Import Data</Link>
        </Button>
      </div>
    </div>
  );
};
