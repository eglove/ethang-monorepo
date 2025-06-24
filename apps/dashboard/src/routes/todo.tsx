import { useStore } from "@ethang/store/use-store";
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
import isNil from "lodash/isNil.js";
import isString from "lodash/isString";
import { DateTime } from "luxon";

import { DateColumn } from "../components/data-column.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { TableWrapper } from "../components/table-wrapper.tsx";
import { CreateTodoModal } from "../components/todo/create-todo-modal.tsx";
import { useTodoTimerStore } from "../components/todo/todo-timer-store.ts";
import { UpdateDeleteTodo } from "../components/todo/update-delete-todo.tsx";
import { UpdateTodoModal } from "../components/todo/update-todo-modal.tsx";
import { queryKeys } from "../data/queries/queries.ts";
import { SectionHeader } from "../section-header.tsx";
import { authStore } from "../stores/auth-store.ts";
import { todoStore } from "../stores/todo-store.ts";

const columns = [
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "dueDate", label: "Due Date" },
  { key: "recurs", label: "Next Due" },
  { key: "actions", label: "Actions" },
];

const Todo = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const todoTimerStore = useTodoTimerStore();

  const { data, isPending } = useQuery(todoStore.getAll(userId ?? undefined));

  return (
    <MainLayout breadcrumbPaths={[{ href: "/todo", label: "Todo" }]}>
      <SectionHeader
        openModal={() => {
          todoStore.setIsCreateModalOpen(true);
        }}
        header="Todos"
        modalLabel="Add Todo"
        refreshKeys={queryKeys.allUserTodos(userId ?? undefined)}
      >
        <div className="font-bold underline underline-offset-2 text-center">
          {todoTimerStore.currentTime}
        </div>
      </SectionHeader>
      <TableWrapper>
        <Table isStriped removeWrapper aria-label="Todos">
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
                          <DateColumn
                            dateTimeFormatOptions={{
                              dateStyle: "medium",
                              timeStyle: "short",
                            }}
                            date={value}
                          />
                        </TableCell>
                      );
                    }

                    if (
                      "recurs" === columnKey &&
                      isString(item.dueDate) &&
                      !isNil(item.recurs) &&
                      isNumber(value)
                    ) {
                      const nextDue = DateTime.fromISO(item.dueDate)
                        .plus({ millisecond: value })
                        .toISO();

                      return (
                        <TableCell>
                          <DateColumn
                            dateTimeFormatOptions={{
                              dateStyle: "medium",
                              timeStyle: "short",
                            }}
                            date={nextDue}
                          />
                        </TableCell>
                      );
                    }

                    if ("actions" === columnKey) {
                      return (
                        <TableCell>
                          <UpdateDeleteTodo todo={item} />
                        </TableCell>
                      );
                    }

                    return (
                      <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                    );
                  }}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </TableWrapper>
      <CreateTodoModal />
      <UpdateTodoModal />
    </MainLayout>
  );
};

export const Route = createFileRoute("/todo")({
  component: Todo,
});
