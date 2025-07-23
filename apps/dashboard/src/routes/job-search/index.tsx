import { useStore } from "@ethang/store/use-store";
import {
  Button,
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
import isEmpty from "lodash/isEmpty.js";
import isString from "lodash/isString";
import { XIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { DateColumn } from "../../components/data-column.tsx";
import { CreateJobApplicationModal } from "../../components/job-application/create-job-application-modal.tsx";
import { UpdateDeleteApplication } from "../../components/job-application/update-delete-application.tsx";
import { UpdateJobApplicationModal } from "../../components/job-application/update-job-application-modal.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { TableWrapper } from "../../components/table-wrapper.tsx";
import { queryKeys } from "../../data/queries/queries.ts";
import { SectionHeader } from "../../section-header.tsx";
import { applicationStore } from "../../stores/application-store.ts";
import { authStore } from "../../stores/auth-store.ts";

const columns = [
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "url", label: "URL" },
  { key: "jobBoardUrl", label: "Job Board URL" },
  { key: "applied", label: "Applied" },
  { key: "rejected", label: "Rejected" },
  { key: "dmUrl", label: "Email" },
  { key: "dmSent", label: "Email Sent" },
  { key: "actions", label: "Actions" },
];

const RouteComponent = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const { page, search, totalPages } = useStore(applicationStore, (state) => {
    return {
      page: state.page,
      search: state.search,
      totalPages: state.totalPages,
    };
  });

  const {
    data: applications,
    isFetching,
    isPending,
  } = useQuery(applicationStore.getAll(userId ?? undefined));

  return (
    <MainLayout
      breadcrumbPaths={[{ href: "/job-stats", label: "Job Search" }]}
      classNames={{ main: "max-w-none" }}
    >
      <div className="grid h-full grid-rows-[auto_1fr]">
        <SectionHeader
          openModal={() => {
            applicationStore.setIsCreateModalOpen(true);
          }}
          header="Applications"
          isFetching={isFetching}
          modalLabel="Add Application"
          refreshKeys={queryKeys.allUserApplications(userId ?? undefined)}
        >
          <div>
            <Input
              endContent={
                <Button
                  isIconOnly
                  onPress={() => {
                    applicationStore.setSearch("");
                  }}
                  className="size-6"
                  size="sm"
                  variant="ghost"
                >
                  <XIcon />
                </Button>
              }
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
            <TableHeader columns={columns}>
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

                      if (
                        ("url" === columnKey || "jobBoardUrl" === columnKey) &&
                        isString(value) &&
                        !isEmpty(value)
                      ) {
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

                      if (
                        "applied" === columnKey ||
                        "rejected" === columnKey ||
                        "dmSent" === columnKey
                      ) {
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
