import { DateColumn } from "@/components/job-tracker/date-column.tsx";
import { JobApplicationActions } from "@/components/job-tracker/job-application-actions.tsx";
import { getApplicationTableColumns } from "@/components/job-tracker/job-tracker-columns.ts";
import { JobTrackerTableFilterHeader } from "@/components/job-tracker/job-tracker-table-filter-header.tsx";
import { JobTrackerTableFooter } from "@/components/job-tracker/job-tracker-table-footer.tsx";
import {
  setSorting,
  useApplicationTableStore,
} from "@/components/job-tracker/table-state.ts";
import { queries } from "@/data/queries.ts";
import { logger } from "@/lib/logger.ts";
import {
  getKeyValue,
  Link,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import get from "lodash/get";
import isEmpty from "lodash/isEmpty.js";
import isNil from "lodash/isNil";
import isString from "lodash/isString.js";
import sortBy from "lodash/sortBy.js";
import split from "lodash/split.js";
import startsWith from "lodash/startsWith.js";
import { useEffect, useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";

export const JobTrackerTable = () => {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const store = useApplicationTableStore();
  const filters = useMemo(() => {
    return {
      page,
      search: store.search,
      sorting: store.sorting,
      tableFilters: store.tableFilters,
    };
  }, [page, store.search, store.tableFilters, store.sorting]);

  const query = useQuery(queries.getApplications(filters));

  useEffect(() => {
    queryClient
      .prefetchQuery(
        queries.getApplications({
          ...filters,
          page: page + 1,
        }),
      )
      .catch(logger.error);

    if (1 < page) {
      queryClient
        .prefetchQuery(
          queries.getApplications({
            ...filters,
            page: page - 1,
          }),
        )
        .catch(logger.error);
    }
  }, [filters, page, queryClient]);

  return (
    <>
      <JobTrackerTableFilterHeader />
      <Table
        isHeaderSticky
        isStriped
        bottomContent={
          <JobTrackerTableFooter
            page={page}
            setPage={setPage}
            total={get(query, ["data", "total"])}
          />
        }
        onSortChange={(descriptor) => {
          setSorting(String(descriptor.column));
        }}
        sortDescriptor={{
          column: store.sorting.id,
          direction:
            "desc" === store.sorting.direction ? "descending" : "ascending",
        }}
        aria-label="Job Applications"
      >
        <TableHeader
          columns={getApplicationTableColumns(query.data?.applications)}
        >
          {(item) => {
            return (
              <TableColumn
                allowsSorting={
                  "actions" !== item.key && !startsWith(item.key, "round")
                }
                key={item.key}
              >
                {item.label}
              </TableColumn>
            );
          }}
        </TableHeader>
        <TableBody
          emptyContent="Nothing to display"
          items={query.data?.applications ?? []}
          loadingContent={<Spinner />}
          loadingState={query.isPending ? "loading" : "idle"}
        >
          {(item) => {
            return (
              <TableRow
                className={twMerge(
                  !isNil(item.rejected) && "text-danger",
                  isNil(item.rejected) &&
                    !isEmpty(item.interviewRounds) &&
                    "text-secondary-400",
                )}
                key={item.id}
              >
                {(columnKey) => {
                  const value = getKeyValue(item, columnKey) as unknown;

                  if ("url" === columnKey && isString(value)) {
                    return (
                      <TableCell>
                        <Link
                          isExternal
                          showAnchorIcon
                          className="min-w-24 break-all"
                          href={value}
                          underline="always"
                        >
                          {URL.canParse(value)
                            ? new URL(value).hostname
                            : value}
                        </Link>
                      </TableCell>
                    );
                  }

                  if ("actions" === columnKey) {
                    return (
                      <TableCell className="flex gap-2">
                        <JobApplicationActions id={item.id} />
                      </TableCell>
                    );
                  }

                  if (startsWith(String(columnKey), "round")) {
                    const rounds = sortBy(get(item, ["interviewRounds"], []));
                    const date = get(rounds, [
                      Number(split(String(columnKey), "-")[1]) - 1,
                    ]);

                    return (
                      <TableCell>
                        <DateColumn date={date} />
                      </TableCell>
                    );
                  }

                  if ("applied" === columnKey || "rejected" === columnKey) {
                    return (
                      <TableCell>
                        <DateColumn date={value} />
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell
                      className={twMerge("title" === columnKey && "max-w-96")}
                    >
                      {getKeyValue(item, columnKey)}
                    </TableCell>
                  );
                }}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </>
  );
};
