import type { JobApplication } from "@/types/job-application.ts";
import type { ColumnDef } from "@tanstack/react-table";

import { SortButton } from "@/components/common/sort-button.tsx";
import { DateColumn } from "@/components/job-tracker/date-column.tsx";
import { JobApplicationActions } from "@/components/job-tracker/job-application-actions.tsx";
import { Link } from "@tanstack/react-router";
import get from "lodash/get";
import isNil from "lodash/isNil";

type GetApplicationTableColumnsProperties = {
  rounds: number;
};

export const getApplicationTableColumns = ({
  rounds,
}: GetApplicationTableColumnsProperties): ColumnDef<JobApplication>[] => {
  const roundColumns: ColumnDef<JobApplication>[] = [];

  for (let index = 0; index < rounds; index += 1) {
    roundColumns.push({
      cell: ({ row }) => {
        const value = get(row, ["original", "interviewRounds", index]);

        if (isNil(value)) {
          return null;
        }

        return <DateColumn date={value} />;
      },
      header: `Round ${index + 1}`,
      id: `round${index}`,
    });
  }

  return [
    {
      accessorKey: "title",
      header: ({ header }) => {
        return (
          <SortButton
            isSorted={header.column.getIsSorted()}
            sortHandler={header.column.getToggleSortingHandler()}
          >
            Title
          </SortButton>
        );
      },
    },
    {
      accessorKey: "company",
      header: ({ header }) => {
        return (
          <SortButton
            isSorted={header.column.getIsSorted()}
            sortHandler={header.column.getToggleSortingHandler()}
          >
            Company
          </SortButton>
        );
      },
    },
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
      header: ({ header }) => {
        return (
          <SortButton
            isSorted={header.column.getIsSorted()}
            sortHandler={header.column.getToggleSortingHandler()}
          >
            URL
          </SortButton>
        );
      },
    },
    {
      accessorKey: "applied",
      cell: ({ row }) => {
        return <DateColumn date={row.original.applied} />;
      },
      header: ({ header }) => {
        return (
          <SortButton
            isSorted={header.column.getIsSorted()}
            sortHandler={header.column.getToggleSortingHandler()}
          >
            Applied
          </SortButton>
        );
      },
    },
    ...roundColumns,
    {
      accessorKey: "rejected",
      cell: ({ row }) => {
        return <DateColumn date={row.original.rejected} />;
      },
      header: ({ header }) => {
        return (
          <SortButton
            isSorted={header.column.getIsSorted()}
            sortHandler={header.column.getToggleSortingHandler()}
          >
            Rejected
          </SortButton>
        );
      },
    },
    {
      accessorKey: "id",
      cell: ({ row }) => {
        return <JobApplicationActions id={row.original.id} />;
      },
      header: "Actions",
    },
  ];
};
