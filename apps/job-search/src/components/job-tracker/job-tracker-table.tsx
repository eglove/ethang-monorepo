import type { JobApplication } from "@/types/job-application.ts";

import { jobTrackerColumns } from "@/components/job-tracker/job-tracker-columns.tsx";
import { Button } from "@/components/ui/button.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.tsx";
import { queries } from "@/data/queries.ts";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import map from "lodash/map.js";

export const JobTrackerTable = () => {
  const query = useQuery(queries.getApplications());
  const table = useReactTable<JobApplication>({
    columns: jobTrackerColumns,
    data: query.data ?? [],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="m-4">
      <div className="flex justify-end my-4">
        <Button asChild size="sm">
          <Link to="/upsert-application">Add Application</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
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
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {map(row.getVisibleCells(), (cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                className="h-24 text-center"
                colSpan={jobTrackerColumns.length}
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
