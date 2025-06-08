import { useUser } from "@clerk/clerk-react";
import {
  getKeyValue,
  Link,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CreateBookmarkModal } from "../components/bookmarks/create-bookmark-modal.tsx";
import { UpdateBookmarkModal } from "../components/bookmarks/update-bookmark-modal.tsx";
import { UpdateDeleteBookmark } from "../components/bookmarks/update-delete-bookmark.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { TableWrapper } from "../components/table-wrapper.tsx";
import { bookmarkStore } from "../data/bookmark-store.ts";
import { queryKeys } from "../data/queries/queries.ts";
import { SectionHeader } from "../section-header.tsx";

const columns = [
  { key: "title", label: "Title" },
  { key: "actions", label: "Actions" },
];

const BookMarks = () => {
  const { user } = useUser();

  const { data: bookmarks, isPending } = useQuery(
    bookmarkStore.getAll(user?.id),
  );

  return (
    <MainLayout breadcrumbPaths={[{ href: "/bookmarks", label: "Bookmarks" }]}>
      <SectionHeader
        modalKey={() => {
          bookmarkStore.setIsCreateModalOpen(true);
        }}
        header="Bookmarks"
        modalLabel="Add Bookmark"
        refreshKeys={queryKeys.bookmarks(user?.id)}
      />
      <TableWrapper>
        <Table isStriped removeWrapper aria-label="Bookmarks">
          <TableHeader columns={columns}>
            {(column) => {
              return <TableColumn key={column.key}>{column.label}</TableColumn>;
            }}
          </TableHeader>
          <TableBody
            emptyContent={isPending ? "Loading..." : "No Data"}
            items={bookmarks ?? []}
          >
            {(item) => {
              return (
                <TableRow key={item.id}>
                  {(columnKey) => {
                    switch (columnKey) {
                      case "actions": {
                        return (
                          <TableCell>
                            <UpdateDeleteBookmark bookmark={item} />
                          </TableCell>
                        );
                      }

                      case "title": {
                        return (
                          <TableCell>
                            <Link isExternal href={item.url} underline="always">
                              {item.title}
                            </Link>
                          </TableCell>
                        );
                      }

                      default: {
                        return (
                          <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                        );
                      }
                    }
                  }}
                </TableRow>
              );
            }}
          </TableBody>
        </Table>
      </TableWrapper>
      <CreateBookmarkModal />
      <UpdateBookmarkModal />
    </MainLayout>
  );
};

export const Route = createFileRoute("/bookmarks")({
  component: BookMarks,
});
