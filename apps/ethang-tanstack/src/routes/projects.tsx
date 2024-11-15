import { Link } from "@nextui-org/link";
import { Spinner } from "@nextui-org/spinner";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isArray from "lodash/isArray.js";

import { MainLayout } from "../components/layouts/main-layout";
import { ProjectActions } from "../components/project/project-actions";
import { projectsQuery } from "../query/projects";

const columns = [
  {
    key: "name",
    label: "Name",
  },
  {
    key: "actions",
    label: "Details",
  },
];

const RouteComponent = () => {
  const { data } = useQuery(projectsQuery());

  return (
    <MainLayout>
      <Table
        aria-label="Projects"
      >
        <TableHeader columns={columns}>
          {(column) => {
            return (
              <TableColumn key={column.key}>
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
                  if ("name" === columnKey) {
                    return (
                      <TableCell>
                        <Link
                          isExternal
                          showAnchorIcon
                          color="foreground"
                          href={item.url}
                          underline="always"
                        >
                          {getKeyValue(item, columnKey)}
                        </Link>
                      </TableCell>
                    );
                  }

                  if ("actions" === columnKey) {
                    return (
                      <TableCell>
                        <ProjectActions project={item} />
                      </TableCell>
                    );
                  }

                  return (
                    <TableCell>
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

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});
