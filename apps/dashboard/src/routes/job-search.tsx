import { useUser } from "@clerk/clerk-react";
import {
  Button,
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isString from "lodash/isString";
import { PlusIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import { DateColumn } from "../components/data-column.tsx";
import { UpdateDeleteApplication } from "../components/job-application/update-delete-application.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { getApplications } from "../data/queries/application.ts";
import { modalStore } from "../global-stores/modal-store.ts";

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

  const { data, isPending } = useQuery(getApplications(user?.id));

  return (
    <MainLayout>
      <div className="flex justify-between items-center my-4">
        <div className="prose">
          <h2 className="text-foreground">Job Search</h2>
        </div>
        <Button
          isIconOnly
          onPress={() => {
            modalStore.openModal("createJobApplication");
          }}
          aria-label="Add Application"
          color="primary"
          size="sm"
        >
          <PlusIcon />
        </Button>
      </div>
      <Table isHeaderSticky isStriped aria-label="Job Search">
        <TableHeader columns={columns}>
          {(item) => {
            return <TableColumn key={item.key}>{item.label}</TableColumn>;
          }}
        </TableHeader>
        <TableBody
          emptyContent="Nothing to Display"
          items={data ?? []}
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
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search")({
  component: RouteComponent,
});
