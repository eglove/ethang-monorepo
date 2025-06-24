import { useStore } from "@ethang/store/use-store";
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
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import isString from "lodash/isString";

import { CreateContactModal } from "../../components/contact/create-contact-modal.tsx";
import { UpdateContactModal } from "../../components/contact/update-contact-modal.tsx";
import { UpdateDeleteContact } from "../../components/contact/update-delete-contact.tsx";
import { DateColumn } from "../../components/data-column.tsx";
import { MainLayout } from "../../components/layouts/main-layout.tsx";
import { TableWrapper } from "../../components/table-wrapper.tsx";
import { queryKeys } from "../../data/queries/queries.ts";
import { SectionHeader } from "../../section-header.tsx";
import { authStore } from "../../stores/auth-store.ts";
import { contactStore } from "../../stores/contact-store.ts";

const columns = [
  { key: "name", label: "Name" },
  { key: "lastContact", label: "Last Contact" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "linkedIn", label: "LinkedIn" },
  { key: "expectedNextContact", label: "Expected Next Contact" },
  { key: "actions", label: "Actions" },
];

const RouteComponent = () => {
  const userId = useStore(authStore, (state) => state.userId);
  const { data, isPending } = useQuery(
    contactStore.getAll(userId ?? undefined),
  );

  return (
    <MainLayout
      breadcrumbPaths={[
        { href: "/job-search", label: "Job Search" },
        { href: "/job-search/contact", label: "Contact" },
      ]}
    >
      <SectionHeader
        openModal={() => {
          contactStore.setIsCreateModalOpen(true);
        }}
        header="Contacts"
        modalLabel="Create Contact"
        refreshKeys={queryKeys.allContacts(userId ?? undefined)}
      />
      <TableWrapper>
        <Table isHeaderSticky isStriped removeWrapper aria-label="Contacts">
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

                    if (
                      "lastContact" === columnKey ||
                      "expectedNextContact" === columnKey
                    ) {
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

                    if ("phone" === columnKey && isString(value)) {
                      return (
                        <TableCell>
                          <Link href={`tel:${value}`}>{value}</Link>
                        </TableCell>
                      );
                    }

                    if ("email" === columnKey && isString(value)) {
                      return (
                        <TableCell>
                          <Link href={`mailto:${value}`}>{value}</Link>
                        </TableCell>
                      );
                    }

                    if ("linkedIn" === columnKey && isString(value)) {
                      return (
                        <TableCell>
                          <Link isExternal showAnchorIcon href={value}>
                            Open LinkedIn
                          </Link>
                        </TableCell>
                      );
                    }

                    if ("actions" === columnKey) {
                      return (
                        <TableCell>
                          <UpdateDeleteContact contact={item} />
                        </TableCell>
                      );
                    }

                    if (isString(value)) {
                      return <TableCell>{value}</TableCell>;
                    }

                    return <TableCell>{null}</TableCell>;
                  }}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </TableWrapper>
      <CreateContactModal />
      <UpdateContactModal />
    </MainLayout>
  );
};

export const Route = createFileRoute("/job-search/contact")({
  component: RouteComponent,
});
