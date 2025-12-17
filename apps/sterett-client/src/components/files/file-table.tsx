import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";

import type { filesRouteQueries } from "../../routes/files.tsx";

import { Link } from "../link.tsx";
import { FileTableTop } from "./file-table-top.tsx";
import { useFileTable } from "./use-file-table.ts";

const columns = [
  {
    key: "title",
    label: "Title",
  },
];

type FileTableProperties = {
  readonly query: keyof typeof filesRouteQueries;
};

export const FileTable = ({ query }: FileTableProperties) => {
  const { filter, setFilter, setSortConfig, sortConfig, sortedData } =
    useFileTable(query);

  return (
    <div className="w-full">
      <FileTableTop query={query} filter={filter} setFilter={setFilter} />
      <Table
        isStriped
        hideHeader
        isHeaderSticky
        color="primary"
        showDragButtons
        sortDescriptor={sortConfig}
        onSortChange={setSortConfig}
        title="Sterett Creek Village Trustee Files"
        aria-label="Sterett Creek Village Trustee Files"
        classNames={{
          base: "max-h-96 overflow-auto",
        }}
      >
        <TableHeader columns={columns}>
          {(column) => {
            return (
              <TableColumn
                key={column.key}
                allowsSorting={"actions" !== column.key}
              >
                {column.label}
              </TableColumn>
            );
          }}
        </TableHeader>
        <TableBody items={sortedData}>
          {(item) => {
            return (
              <TableRow key={item._id}>
                {(columnKey) => {
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
                  const value = getKeyValue(item, columnKey) as string;

                  if ("date" === columnKey) {
                    return (
                      <TableCell>
                        {new Date(value).toLocaleString(undefined, {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell>
                      <Link
                        isExternal
                        showAnchorIcon
                        href={item.file.asset.url}
                      >
                        {value}
                      </Link>
                    </TableCell>
                  );
                }}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </div>
  );
};
