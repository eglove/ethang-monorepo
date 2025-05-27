import { useUser } from "@clerk/clerk-react";
import { isNumber } from "@ethang/toolbelt/is/number";
import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isString from "lodash/isString";
import { DateTime } from "luxon";

import { DateColumn } from "../components/data-column.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { getTodos } from "../data/queries/todo.ts";
import { SectionHeader } from "../section-header.tsx";

const columns = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "dueDate", label: "Due Date" },
  { key: "recurs", label: "Next Due" },
];

const Todo = () => {
  const { user } = useUser();

  const { data, isPending } = useQuery(getTodos(user?.id));

  return (
    <MainLayout>
      <SectionHeader
        header="Todos"
        modalKey="createTodo"
        modalLabel="Add Todo"
      />
      <Table isStriped aria-label="Todos">
        <TableHeader columns={columns}>
          {(column) => {
            return <TableColumn key={column.key}>{column.label}</TableColumn>;
          }}
        </TableHeader>
        <TableBody
          emptyContent={isPending ? "Loading..." : "No Data"}
          items={data ?? []}
        >
          {(item) => {
            return (
              <TableRow key={item.id}>
                {(columnKey) => {
                  const value = getKeyValue(item, columnKey) as unknown;

                  if ("title" === columnKey && isString(value)) {
                    return <TableCell>{value}</TableCell>;
                  }

                  if ("description" === columnKey && isString(value)) {
                    return (
                      <TableCell className="max-w-xs text-wrap">
                        {value}
                      </TableCell>
                    );
                  }

                  if ("dueDate" === columnKey && isString(value)) {
                    return (
                      <TableCell>
                        <DateColumn date={value} />
                      </TableCell>
                    );
                  }

                  if (
                    "recurs" === columnKey &&
                    isString(item.dueDate) &&
                    isNumber(value)
                  ) {
                    const nextDue = DateTime.fromISO(item.dueDate)
                      .plus({ millisecond: value })
                      .toISO();

                    return (
                      <TableCell>
                        <DateColumn date={nextDue} />
                      </TableCell>
                    );
                  }

                  return <TableCell>{getKeyValue(item, columnKey)}</TableCell>;
                }}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </MainLayout>
  );
};

export const Route = createFileRoute("/todo")({
  component: Todo,
});
