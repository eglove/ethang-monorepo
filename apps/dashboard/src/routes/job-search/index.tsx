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
import isString from "lodash/isString";
import toInteger from "lodash/toInteger";
import { useState } from "react";
import { twMerge } from "tailwind-merge";
import { useDebounce } from "use-debounce";

import { DateColumn } from "../../components/data-column.tsx";
import { CreateJobApplicationModal } from "../../components/job-application/create-job-application-modal.tsx";
import { UpdateDeleteApplication } from "../../components/job-application/update-delete-application.tsx";
import { UpdateJobApplicationModal } from "../../components/job-application/update-job-application-modal.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { getApplications } from "../../data/queries/application.ts";
import { queryKeys } from "../../data/queries/queries.ts";
import { SectionHeader } from "../../section-header.tsx";

const columns = [
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "url", label: "URL" },
  { key: "applied", label: "Applied" },
  { key: "rejected", label: "Rejected" },
  { key: "actions", label: "Actions" },
];

const RouteComponent = () => {
  const { user } = useUser();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const { data: applications, isPending } = useQuery(
    getApplications(user?.id, page, debouncedSearch),
  );

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
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              onChange={setPage}
              page={page}
              total={toInteger(applications?.pagination.totalPages)}
            />
          </div>
        }
        aria-label="Job Search"
      >
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
