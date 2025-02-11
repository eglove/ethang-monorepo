import type { JobApplication } from "@/types/job-application.ts";
import type { ColumnDef } from "@tanstack/react-table";

import { JobApplicationActions } from "@/components/job-tracker/job-application-actions.tsx";
import { Link } from "@tanstack/react-router";

export const jobTrackerColumns: ColumnDef<JobApplication>[] = [
  { accessorKey: "title", header: "Title" },
  { accessorKey: "company", header: "Company" },
  {
    accessorKey: "url",
    cell: ({ row }) => {
      return (
        <Link className="underline" target="_blank" to={row.original.url}>
          {URL.canParse(row.original.url)
            ? new URL(row.original.url).hostname
            : row.original.url}
        </Link>
      );
    },
    header: "URL",
  },
  {
    accessorKey: "applied",
    cell: ({ row }) => {
      const toDate = new Date(row.original.applied);

      return (
        <>
          {toDate.toLocaleString(undefined, {
            dateStyle: "medium",
          })}
        </>
      );
    },
    header: "Applied",
  },
  { accessorKey: "rejected", header: "Rejected" },
  {
    accessorKey: "id",
    cell: ({ row }) => {
      return <JobApplicationActions id={row.original.id} />;
    },
    header: "Actions",
  },
];
