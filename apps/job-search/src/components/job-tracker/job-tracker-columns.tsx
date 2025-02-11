import type { JobApplication } from "@/types/job-application.ts";
import type { ColumnDef } from "@tanstack/react-table";

import { DateColumn } from "@/components/job-tracker/date-column.tsx";
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
      return <DateColumn date={row.original.applied} />;
    },
    header: "Applied",
  },
  {
    accessorKey: "rejected",
    cell: ({ row }) => {
      return <DateColumn date={row.original.rejected} />;
    },
    header: "Rejected",
  },
  {
    accessorKey: "id",
    cell: ({ row }) => {
      return <JobApplicationActions id={row.original.id} />;
    },
    header: "Actions",
  },
];
