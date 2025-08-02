import { useQuery } from "@apollo/client";
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
import { createFileRoute } from "@tanstack/react-router";

import { CreateBookmarkModal } from "../components/bookmarks/create-bookmark-modal.tsx";
import { UpdateBookmarkModal } from "../components/bookmarks/update-bookmark-modal.tsx";
import { UpdateDeleteBookmark } from "../components/bookmarks/update-delete-bookmark.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { TableWrapper } from "../components/table-wrapper.tsx";
import {
  type GetAllBookmarks,
  getAllBookmarks,
} from "../graphql/queries/get-all-bookmarks.ts";
import { SectionHeader } from "../section-header.tsx";
import { bookmarkStore } from "../stores/bookmark-store.ts";

const columns = [
  { key: "title", label: "Title" },
  { key: "actions", label: "Actions" },
];

const BookMarks = () => {
  const { data, loading } = useQuery<GetAllBookmarks>(getAllBookmarks);

  return (
    <MainLayout breadcrumbPaths={[{ href: "/bookmarks", label: "Bookmarks" }]}>
      <SectionHeader
        openModal={() => {
          bookmarkStore.setIsCreateModalOpen(true);
        }}
        header="Bookmarks"
        modalLabel="Add Bookmark"
      />
      <TableWrapper>
        <Table isStriped removeWrapper aria-label="Bookmarks">
          <TableHeader columns={columns}>
            {(column) => {
              return <TableColumn key={column.key}>{column.label}</TableColumn>;
            }}
          </TableHeader>
          <TableBody
            emptyContent={loading ? "Loading..." : "No Data"}
            items={data?.bookmarks ?? []}
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
