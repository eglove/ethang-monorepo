import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { type ColumnDef, flexRender, getCoreRowModel, type TableOptions, useReactTable } from "@tanstack/react-table";
import map from "lodash/map.js";
import merge from "lodash/merge.js";

type DataTableProperties<TData, TValue,> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  options?: TableOptions<TData>;
};

export const DataTable =
    <TData, TValue,>({
      columns,
      data,
      options,
    }: Readonly<DataTableProperties<TData, TValue>>) => {
      const mergedOptions = merge({
        columns,
        data,
        getCoreRowModel: getCoreRowModel(),
      }, options);

      const table = useReactTable(mergedOptions);

      return (
        <div className="my-6 w-full overflow-y-auto">
          <Table className="w-full">
            <TableHeader>
              {map(table.getHeaderGroups(), (headerGroup) => {
                return (
                  <TableRow
                    className="even:bg-muted m-0 border-t p-0"
                    key={headerGroup.id}
                  >
                    {map(headerGroup.headers, (header) => {
                      return (
                        <TableHead
                          className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"
                          key={header.id}
                        >
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
              {table.getRowModel().rows.length
                ? map(table.getRowModel().rows, (row) => {
                  return (
                    <TableRow
                      className="even:bg-muted m-0 border-t p-0"
                      data-state={row.getIsSelected() && "selected"}
                      key={row.id}
                    >
                      {map(row.getVisibleCells(), (cell) => {
                        return (
                          <TableCell
                            className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"
                            key={cell.id}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
                : (
                  <TableRow className="even:bg-muted m-0 border-t p-0">
                    <TableCell
                      className="h-24 border px-4 py-2 text-center [&[align=center]]:text-center [&[align=right]]:text-right"
                      colSpan={columns.length}
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
