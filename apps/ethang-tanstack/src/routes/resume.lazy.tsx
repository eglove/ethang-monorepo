import { DataTable } from "@/clients/data-table.tsx";
import { ContentHandler } from "@/components/common/content-handler.tsx";
import { JobDetails } from "@/components/jobs/job-details.tsx";
import { convexQuery } from "@convex-dev/react-query";
import { TypographyH1 } from "@ethang/react-components/src/components/typography/typography-h1.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { DateTime } from "luxon";

import { api } from "../../convex/_generated/api";
import { MainLayout } from "../components/layouts/main-layout";

const Resume = () => {
  // @ts-expect-error beta
  const jobQuery = useQuery(convexQuery(api.jobs.getAll, {}));

  return (
    <MainLayout>
      <TypographyH1 className="my-2">Resume</TypographyH1>
      <ContentHandler
        error={jobQuery.error}
        isError={jobQuery.isError}
        isLoading={jobQuery.isPending}
      >
        <DataTable
          columns={[
            {
              accessorKey: "title",
              header: "Title",
              sortingFn: "alphanumeric",
            },
            {
              accessorKey: "company",
              header: "Company",
            },
            {
              accessorKey: "startDate",
              cell: (info) => {
                return DateTime.fromISO(String(info.getValue()))
                  .toJSDate()
                  .toLocaleString(undefined, {
                    month: "short",
                    year: "numeric",
                  });
              },
              header: "Start Date",
            },
            {
              accessorKey: "endDate",
              cell: (info) => {
                if (!Date.parse(String(info.getValue()))) {
                  return null;
                }

                return DateTime.fromISO(String(info.getValue()))
                  .toJSDate()
                  .toLocaleString(undefined, {
                    month: "short",
                    year: "numeric",
                  });
              },
              header: "End Date",
            },
            {
              cell: (info) => {
                return <JobDetails job={info.row.original} />;
              },
              header: "Details",
              id: "details",
            },
          ]}
          data={jobQuery.data}
        />
      </ContentHandler>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/resume")({
  component: Resume,
});
