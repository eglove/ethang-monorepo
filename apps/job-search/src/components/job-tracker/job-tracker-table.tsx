import type { JobApplication } from "@/types/job-application.ts";

import { DownloadData } from "@/components/job-tracker/download-data.tsx";
import { getApplicationTableColumns } from "@/components/job-tracker/job-tracker-columns.tsx";
import {
  applicationFormStore,
  setApplicationSorting,
  setCompanyFilter,
  toggleIsShowingInterviewing,
  toggleIsShowingNoStatus,
  toggleIsShowingRejected,
} from "@/components/job-tracker/table-state.ts";
import { Button } from "@/components/ui/button.tsx";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
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
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-store";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import filter from "lodash/filter.js";
import get from "lodash/get";
import includes from "lodash/includes.js";
import isDate from "lodash/isDate.js";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import map from "lodash/map.js";
import toLower from "lodash/toLower.js";
import { XIcon } from "lucide-react";
import { useMemo } from "react";

export const JobTrackerTable = () => {
  const query = useQuery(queries.getApplications());
  const store = useStore(applicationFormStore);

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

    return getApplicationTableColumns({ rounds: maxInterviewRounds });
  }, [query.data]);

  const filteredData = useMemo(() => {
    if (isNil(query.data)) {
      return [];
    }

    return filter(query.data, (datum) => {
      let condition = true;

      if (!store.isShowingInterviewing) {
        condition = isEmpty(datum.interviewRounds);
      }

      if (condition && !store.isShowingRejected) {
        condition = isNil(datum.rejected);
      }

      if (condition && !store.isShowingNoStatus) {
        condition = !isEmpty(datum.interviewRounds) || !isNil(datum.rejected);
      }

      if (condition && !isEmpty(store.companyFilter)) {
        condition = includes(
          toLower(datum.company),
          toLower(store.companyFilter),
        );
      }

      return condition;
    });
  }, [
    query.data,
    store.companyFilter,
    store.isShowingInterviewing,
    store.isShowingNoStatus,
    store.isShowingRejected,
  ]);

  const table = useReactTable<JobApplication>({
    columns,
    data: filteredData,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setApplicationSorting,
    state: { sorting: store.sorting },
  });

  return (
    <div className="m-4">
      <div className="flex justify-between my-4">
        <div className="flex gap-4 items-center">
          <Label className="flex items-center gap-1">
            <Checkbox
              checked={store.isShowingNoStatus}
              onClick={toggleIsShowingNoStatus}
            />
            Show No Status
          </Label>
          <Label className="flex items-center gap-1">
            <Checkbox
              checked={store.isShowingInterviewing}
              onClick={toggleIsShowingInterviewing}
            />
            Show Interviewing
          </Label>
          <Label className="flex items-center gap-1">
            <Checkbox
              checked={store.isShowingRejected}
              onClick={toggleIsShowingRejected}
            />
            Show Rejected
          </Label>
          <div className="flex gap-1">
            <Input
              onChange={(event) => {
                setCompanyFilter(event.target.value);
              }}
              className="max-w-36"
              placeholder="Filter by Company"
              value={store.companyFilter}
            />
            <Button
              onClick={() => {
                setCompanyFilter("");
              }}
              size="icon"
              variant="outline"
            >
              <XIcon />
            </Button>
          </div>
        </div>
        <Button asChild size="sm">
          <Link to="/upsert-application">Add Application</Link>
        </Button>
      </div>
      <div className="relative w-full overflow-y-auto max-h-[600px]">
        <Table>
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
      <div className="flex justify-between items-center my-4 mb-12">
        <div>Count: {query.data?.length ?? ""}</div>
        <div className="flex gap-4">
          <DownloadData />
          <Button asChild size="sm" variant="outline">
            <Link to="/import-data">Import Data</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
