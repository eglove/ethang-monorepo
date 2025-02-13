import type { JobApplication } from "@/types/job-application.ts";

import { getApplicationTableColumns } from "@/components/job-tracker/job-tracker-columns.tsx";
import { JobTrackerTableFilterHeader } from "@/components/job-tracker/job-tracker-table-filter-header.tsx";
import { JobTrackerTableFooter } from "@/components/job-tracker/job-tracker-table-footer.tsx";
import {
  applicationFormStore,
  setSorting,
} from "@/components/job-tracker/table-state.ts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { queries } from "@/data/queries.ts";
import { cn } from "@/lib/utils.ts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-store";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import filter from "lodash/filter.js";
import get from "lodash/get";
import isDate from "lodash/isDate.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import { useEffect, useMemo, useState } from "react";

export const JobTrackerTable = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const store = useStore(applicationFormStore);
  const filters = useMemo(() => {
    return {
      companyFilter: store.companyFilter,
      hasInterviewing: store.isShowingInterviewing,
      hasNoStatus: store.isShowingNoStatus,
      hasRejected: store.isShowingRejected,
      page,
      sorting: store.sorting,
    };
  }, [
    page,
    store.companyFilter,
    store.isShowingInterviewing,
    store.isShowingNoStatus,
    store.isShowingRejected,
    store.sorting,
  ]);

  const query = useQuery(queries.getApplications(filters));

  const queryData = useMemo(() => {
    return query.data ?? [];
  }, [query.data]);

  const columns = useMemo(() => {
    let maxInterviewRounds = 0;

    if (isNil(query.data)) {
      return [];
    }

    for (const datum of query.data) {
      const length = get(datum, ["interviewRounds", "length"], 0);
      if (length > maxInterviewRounds) {
        maxInterviewRounds = length;
      }
    }

    return getApplicationTableColumns({
      rounds: maxInterviewRounds,
      setSorting,
      sorting: store.sorting,
    });
  }, [query.data, store.sorting]);

  const table = useReactTable<JobApplication>({
    columns,
    data: queryData,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    queryClient
      .prefetchQuery(
        queries.getApplications({
          ...filters,
          page: page + 1,
        }),
      )
      // eslint-disable-next-line no-console,sonar/no-reference-error
      .catch(console.error);

    if (1 < page) {
      queryClient
        .prefetchQuery(
          queries.getApplications({
            ...filters,
            page: page - 1,
          }),
        )
        // eslint-disable-next-line no-console
        .catch(console.error);
    }
  }, [filters, page, queryClient]);

  return (
    <div className="m-4">
      <JobTrackerTableFilterHeader />
      <div className="relative w-full overflow-y-auto min-h-[400px] max-h-[600px]">
        <Table className="table-fixed">
          <TableHeader className="sticky top-0 z-10">
            {map(table.getHeaderGroups(), (headerGroup) => {
              return (
                <TableRow key={headerGroup.id}>
                  {map(headerGroup.headers, (header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              map(table.getRowModel().rows, (row) => (
                <TableRow
                  className={cn(
                    !isNil(row.original.rejected) &&
                      "bg-destructive hover:bg-destructive text-destructive-foreground",
                    isNil(row.original.rejected) &&
                      !isEmpty(filter(row.original.interviewRounds, isDate)) &&
                      "bg-blue-300 hover:bg-blue-300",
                  )}
                  data-state={row.getIsSelected() && "selected"}
                  key={row.id}
                >
                  {map(row.getVisibleCells(), (cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  className="h-24 text-center"
                  colSpan={columns.length}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <JobTrackerTableFooter
        page={page}
        setPage={setPage}
        total={query.data?.length ?? 0}
      />
    </div>
  );
};
