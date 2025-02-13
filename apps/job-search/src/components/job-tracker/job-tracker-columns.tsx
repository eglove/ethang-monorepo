import type { Sorting } from "@/components/job-tracker/table-state.ts";
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
  setSorting: (id: string) => void;
  sorting: Sorting;
};

export const getApplicationTableColumns = ({
  rounds,
  setSorting,
  sorting,
}: GetApplicationTableColumnsProperties): ColumnDef<JobApplication>[] => {
  const roundColumns: ColumnDef<JobApplication>[] = [];

  for (let index = 0; index < rounds; index += 1) {
    roundColumns.push({
      cell: ({ row }) => {
        const value = get(row, ["original", "interviewRounds", index]);

        if (isNil(value)) {
          return "";
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
      header: () => {
        return (
          <SortButton
            sortHandler={() => {
              setSorting("title");
            }}
            isSorted={"title" === sorting.id ? sorting.direction : false}
          >
            Title
          </SortButton>
        );
      },
    },
    {
      accessorKey: "company",
      header: () => {
        return (
          <SortButton
            sortHandler={() => {
              setSorting("company");
            }}
            isSorted={"company" === sorting.id ? sorting.direction : false}
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
          <Link
            className="underline break-all"
            target="_blank"
            to={row.original.url}
          >
            {URL.canParse(row.original.url)
              ? new URL(row.original.url).hostname
              : row.original.url}
          </Link>
        );
      },
      header: () => {
        return (
          <SortButton
            sortHandler={() => {
              setSorting("url");
            }}
            isSorted={"url" === sorting.id ? sorting.direction : false}
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
      header: () => {
        return (
          <SortButton
            sortHandler={() => {
              setSorting("applied");
            }}
            isSorted={"applied" === sorting.id ? sorting.direction : false}
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
      header: () => {
        return (
          <SortButton
            sortHandler={() => {
              setSorting("rejected");
            }}
            isSorted={"rejected" === sorting.id ? sorting.direction : false}
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
