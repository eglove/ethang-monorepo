import { DataTable } from "@/clients/data-table.tsx";
import { JobDetails } from "@/components/jobs/job-details.tsx";
import { TypographyH1 } from "@/components/typography/typography-h1.tsx";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { DateTime } from "luxon";

import { MainLayout } from "../components/layouts/main-layout";
import { jobsQuery } from "../query/job";

const Resume = () => {
  const { data } = useQuery(jobsQuery());

  return (
    <MainLayout>
      <TypographyH1 className="my-2">
        Resume
      </TypographyH1>
      <DataTable
        columns={[{
          accessorKey: "title",
          header: "Title",
          sortingFn: "alphanumeric",
        }, {
          accessorKey: "company",
          header: "Company",
        }, {
          accessorKey: "startDate",
          cell: (info) => {
            return DateTime.fromISO(String(info.getValue())).toJSDate()
              .toLocaleString(undefined, {
                month: "short",
                year: "numeric",
              });
          },
          header: "Start Date",
        }, {
          accessorKey: "endDate",
          cell: (info) => {
            if (!Date.parse(String(info.getValue()))) {
              return null;
            }

            return DateTime.fromISO(String(info.getValue())).toJSDate()
              .toLocaleString(undefined, {
                month: "short",
                year: "numeric",
              });
          },
          header: "End Date",
        }, {
          cell: (info) => {
            return <JobDetails job={info.row.original} />;
          },
          header: "Details",
          id: "details",
        }]}
        data={data ?? []}
      />
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/resume")({
  component: Resume,
});
