import { useUser } from "@clerk/clerk-react";
import {
  getKeyValue,
  Input,
  Link,
  Pagination,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import isString from "lodash/isString";
import replace from "lodash/replace.js";
import startsWith from "lodash/startsWith";
import sumBy from "lodash/sumBy.js";
import times from "lodash/times.js";
import toInteger from "lodash/toInteger";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useDebounce } from "use-debounce";

import { DateColumn } from "../../components/data-column.tsx";
import { CreateJobApplicationModal } from "../../components/job-application/create-job-application-modal.tsx";
import { UpdateDeleteApplication } from "../../components/job-application/update-delete-application.tsx";
import { UpdateJobApplicationModal } from "../../components/job-application/update-job-application-modal.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { TableBaseComponent } from "../../components/table-base-component.tsx";
import { getApplications } from "../../data/queries/application.ts";
import { queryKeys } from "../../data/queries/queries.ts";
import { SectionHeader } from "../../section-header.tsx";

const getColumns = (maxRoundCount: number) => {
  const roundsColumns = times(maxRoundCount, (index) => {
    return { key: `round${index}`, label: `Round ${index + 1}` };
  });

  return [
    { key: "title", label: "Title" },
    { key: "company", label: "Company" },
    { key: "url", label: "URL" },
    { key: "applied", label: "Applied" },
    ...roundsColumns,
    { key: "rejected", label: "Rejected" },
    { key: "actions", label: "Actions" },
  ];
};

const RouteComponent = () => {
  const { user } = useUser();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const { data: applications, isPending } = useQuery(
    getApplications(user?.id, page, debouncedSearch),
  );

  const nextPage = page + 1;
  const previousPage = page - 1;
  const totalPages = get(applications, ["pagination", "totalPages"]);
  const maxRoundsCount = sumBy(applications?.data, "interviewRounds.length");

  useQuery({
    ...getApplications(user?.id, nextPage),
    enabled: !isNil(totalPages) && nextPage < totalPages,
  });

  useQuery({
    ...getApplications(user?.id, previousPage),
    enabled: !isNil(totalPages) && 0 < previousPage,
  });

  return (
    <MainLayout breadcrumbPaths={[{ href: "/job-stats", label: "Job Search" }]}>
      <SectionHeader
        header="Applications"
        modalKey="createJobApplication"
        modalLabel="Add Application"
        refreshKeys={queryKeys.allUserApplications(user?.id)}
      >
        <div>
          <Input
            aria-label="Search"
            onValueChange={setSearch}
            placeholder="Search"
            size="sm"
            value={search}
          />
        </div>
      </SectionHeader>
      <Table
        isHeaderSticky
        isStriped
        BaseComponent={(properties) => {
          return (
            <TableBaseComponent
              {...properties}
              bottomContent={
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  classNames={{ base: "mx-auto" }}
                  color="secondary"
                  onChange={setPage}
                  page={page}
                  total={toInteger(applications?.pagination.totalPages)}
                />
              }
            />
          );
        }}
        aria-label="Job Search"
      >
        <TableHeader columns={getColumns(maxRoundsCount)}>
          {(item) => {
            return <TableColumn key={item.key}>{item.label}</TableColumn>;
          }}
        </TableHeader>
        <TableBody
          emptyContent="Nothing to Display"
          items={applications?.data ?? []}
          loadingContent={<Spinner />}
          loadingState={isPending ? "loading" : "idle"}
        >
          {(item) => {
            return (
              <TableRow key={item.id}>
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

                  if ("applied" === columnKey || "rejected" === columnKey) {
                    return (
                      <TableCell>
                        <DateColumn date={value} />
                      </TableCell>
                    );
                  }

                  if ("actions" === columnKey) {
                    return (
                      <TableCell>
                        <UpdateDeleteApplication application={item} />
                      </TableCell>
                    );
                  }

                  if (isString(columnKey) && startsWith(columnKey, "round")) {
                    const dateTime = get(
                      item,
                      [
                        "interviewRounds",
                        toInteger(replace(columnKey, "round", "")),
                        "dateTime",
                      ],
                      null,
                    );

                    return (
                      <TableCell>
                        <DateColumn date={dateTime} />
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
      <CreateJobApplicationModal />
      <UpdateJobApplicationModal />
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search/")({
  component: RouteComponent,
});
