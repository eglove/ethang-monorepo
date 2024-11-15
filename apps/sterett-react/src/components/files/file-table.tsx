import { getKeyValue } from "@nextui-org/react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/table";

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
      <FileTableTop
        filter={filter}
        query={query}
        setFilter={setFilter}
      />
      <Table
        hideHeader
        isHeaderSticky
        isStriped
        showDragButtons
        classNames={{
          base: "max-h-96 overflow-auto",
        }}
        aria-label="Sterett Creek Village Trustee Files"
        color="primary"
        onSortChange={setSortConfig}
        sortDescriptor={sortConfig}
        title="Sterett Creek Village Trustee Files"
      >
        <TableHeader columns={columns}>
          {(column) => {
            return (
              <TableColumn
                allowsSorting={"actions" !== column.key}
                key={column.key}
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
