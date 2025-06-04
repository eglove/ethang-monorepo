import { useUser } from "@clerk/clerk-react";
import {
  getKeyValue,
  Input,
  Link,
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
import isString from "lodash/isString";
import replace from "lodash/replace.js";
import startsWith from "lodash/startsWith";
import times from "lodash/times.js";
import toInteger from "lodash/toInteger";
import { twMerge } from "tailwind-merge";

import { DateColumn } from "../../components/data-column.tsx";
import { CreateJobApplicationModal } from "../../components/job-application/create-job-application-modal.tsx";
import { UpdateDeleteApplication } from "../../components/job-application/update-delete-application.tsx";
import { UpdateJobApplicationModal } from "../../components/job-application/update-job-application-modal.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { TableWrapper } from "../../components/table-wrapper.tsx";
import {
  applicationStore,
  useApplicationStore,
} from "../../data/application-store.ts";
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

  const { maxRoundsCount, page, search, totalPages } = useApplicationStore(
    (state) => {
      return {
        maxRoundsCount: state.maxRoundsCount,
        page: state.page,
        search: state.search,
        totalPages: state.totalPages,
      };
    },
  );

  const {
    data: applications,
    isFetching,
    isPending,
  } = useQuery(applicationStore.getAll(user?.id));

  return (
    <MainLayout breadcrumbPaths={[{ href: "/job-stats", label: "Job Search" }]}>
      <div className="grid grid-rows-[auto_1fr] h-full">
        <SectionHeader
          modalKey={() => {
            applicationStore.setIsCreateModalOpen(true);
          }}
          header="Applications"
          isFetching={isFetching}
          modalLabel="Add Application"
          refreshKeys={queryKeys.allUserApplications(user?.id)}
        >
          <div>
            <Input
              onValueChange={(value) => {
                applicationStore.setSearch(value);
              }}
              aria-label="Search"
              placeholder="Search"
              size="sm"
              value={search}
            />
          </div>
        </SectionHeader>
        <TableWrapper
          paginationProps={{
            classNames: { base: "mx-auto" },
            color: "secondary",
            isCompact: true,
            onChange: (value) => {
              applicationStore.setPage(value);
            },
            page,
            showControls: true,
            showShadow: true,
            total: totalPages,
          }}
        >
          <Table isHeaderSticky isStriped removeWrapper aria-label="Job Search">
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

                      if (
                        isString(columnKey) &&
                        startsWith(columnKey, "round")
                      ) {
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
                          className={twMerge(
                            "title" === columnKey && "max-w-96",
                          )}
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
        </TableWrapper>
      </div>
      <CreateJobApplicationModal />
      <UpdateJobApplicationModal />
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search/")({
  component: RouteComponent,
});
