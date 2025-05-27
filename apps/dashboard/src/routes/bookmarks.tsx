import { useUser } from "@clerk/clerk-react";
import {
  Button,
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
import { PlusIcon } from "lucide-react";

import { UpdateDeleteBookmark } from "../components/bookmarks/update-delete-bookmark.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { getBookmarks } from "../data/queries/bookmark.ts";
import { modalStore } from "../global-stores/modal-store.ts";
import { SectionHeader } from "../section-header.tsx";

const columns = [
  { key: "title", label: "Title" },
  { key: "actions", label: "Actions" },
];

const BookMarks = () => {
  const { user } = useUser();

  const { data: bookmarks, isPending } = useQuery(getBookmarks(user?.id));

  return (
    <MainLayout>
      <SectionHeader
        header="Bookmarks"
        modalKey="createBookmark"
        modalLabel="Add Bookmark"
      />
      <Table isStriped aria-label="Bookmarks">
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
    </MainLayout>
  );
};

export const Route = createFileRoute("/bookmarks")({
  component: BookMarks,
});
