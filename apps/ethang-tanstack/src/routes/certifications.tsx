import { Link } from "@nextui-org/link";
import { Spinner } from "@nextui-org/spinner";
import { getKeyValue, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@nextui-org/table";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isArray from "lodash/isArray";
import isString from "lodash/isString";

import { CertificationDetails } from "../components/certification/certification-details";
import { MainLayout } from "../components/layouts/main-layout";
import { LearningProfileLinks } from "../components/learning-profile/learning-profile-links";
import { certificationsQuery } from "../query/certifications";

const columns = [
  {
    key: "name",
    label: "Name",
  },
  {
    key: "issuedBy",
    label: "Issued By",
  },
  {
    key: "issuedOn",
    label: "Issued On",
  },
  {
    key: "expires",
    label: "Expires",
  },
  {
    key: "actions",
    label: "Details",
  },
];

const RouteComponent = () => {
  const { data } = useQuery(certificationsQuery());

  return (
    <MainLayout>
      <LearningProfileLinks />
      <Table
        aria-label="certifications"
        className="my-4"
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
                  const value = getKeyValue(item, columnKey) as string;

                  switch (columnKey) {
                    case "actions": {
                      return (
                        <TableCell>
                          <CertificationDetails certification={item} />
                        </TableCell>
                      );
                    }

                    case "expires":
                    case "issuedOn": {
                      return (
                        <TableCell>
                          {isString(value)
                            ? new Date(value)
                              .toLocaleString(undefined, {
                                month: "long",
                                year: "numeric",
                              })
                            : null}
                        </TableCell>
                      );
                    }

                    case "issuedBy": {
                      return (
                        <TableCell>
                          <Link
                            isExternal
                            showAnchorIcon
                            color="foreground"
                            href={item.url}
                            underline="always"
                          >
                            {value}
                          </Link>
                        </TableCell>
                      );
                    }

                    default: {
                      return (
                        <TableCell>
                          {value}
                        </TableCell>
                      );
                    }
                  }
                }}
              </TableRow>
            );
          }}
        </TableBody>
      </Table>
    </MainLayout>
  );
};

export const Route = createFileRoute("/certifications")({
  component: RouteComponent,
});
