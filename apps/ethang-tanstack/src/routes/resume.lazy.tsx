import { useObservable } from "@legendapp/state/react";
import { getKeyValue, TableCell, TableRow } from "@nextui-org/react";
import { Spinner } from "@nextui-org/spinner";
import {
  type SortDescriptor,
  Table,
  TableBody,
  TableColumn,
  TableHeader,
} from "@nextui-org/table";
import { useQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import isArray from "lodash/isArray.js";
import isString from "lodash/isString.js";
import orderBy from "lodash/orderBy.js";

import { queryClient } from "../clients/query";
import { JobActions } from "../components/jobs/job-actions";
import { jobsColumns } from "../components/jobs/jobs-columns";
import { MainLayout } from "../components/layouts/main-layout";
import { jobsQuery } from "../query/job";

const Resume = () => {
  const { data } = useQuery(jobsQuery());
  const store = useObservable<SortDescriptor>({
    column: "endDate",
    direction: "descending",
  });

  return (
    <MainLayout>
      <Table
        onSortChange={({ column, direction }) => {
          const sorted = orderBy(
            data,
            column,
            "ascending" === direction
              ? "asc"
              : "desc",
          );
          queryClient.setQueryData(jobsQuery().queryKey, sorted);

          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          store.set({
            column,
            direction,
          } as SortDescriptor);
        }}
        aria-label="Jobs"
        sortDescriptor={store.get() as SortDescriptor}
      >
        <TableHeader columns={jobsColumns}>
          {(column) => {
            return (
              <TableColumn
                allowsSorting
                key={column.key}
              >
                {column.label}
              </TableColumn>
            );
          }}
        </TableHeader>
        <TableBody
          items={isArray(data)
            ? data
            : []}
          emptyContent={<Spinner />}
        >
          {(item) => {
            return (
              <TableRow key={item._id}>
                {(columnKey) => {
                  if ("startDate" === columnKey || "endDate" === columnKey) {
                    return (
                      <TableCell key={columnKey}>
                        {isString(getKeyValue(item, columnKey))
                          ? new Date(
                            String(getKeyValue(item, columnKey)),
                          ).toLocaleDateString(undefined, {
                            month: "long",
                            year: "numeric",
                          })
                          : "(Current)"}
                      </TableCell>
                    );
                  }

                  if ("actions" === columnKey) {
                    return (
                      <TableCell>
                        <JobActions job={item} />
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell key={columnKey}>
                      {getKeyValue(item, columnKey)}
                    </TableCell>
                  );
                }}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </MainLayout>
  );
};

export const Route = createLazyFileRoute("/resume")({
  component: Resume,
});
