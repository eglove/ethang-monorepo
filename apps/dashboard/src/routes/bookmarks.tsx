import { useUser } from "@clerk/clerk-react";
import {
  getKeyValue,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { CreateBookmark } from "../components/bookmarks/create-bookmark.tsx";
import { UpdateDeleteBookmark } from "../components/bookmarks/update-delete-bookmark.tsx";
import { MainLayout } from "../components/layouts/main-layout.tsx";
import { getBookmarks } from "../data/queries/bookmark.ts";

const columns = [
  { key: "title", label: "Title" },
  { key: "url", label: "URL" },
  { key: "actions", label: "Actions" },
];

const BookMarks = () => {
  const { user } = useUser();

  const { data: bookmarks, isPending } = useQuery(getBookmarks(user?.id));

  return (
    <MainLayout>
      <div className="flex justify-between items-center my-4">
        <div className="prose">
          <h2 className="text-foreground">Bookmarks</h2>
        </div>
        <CreateBookmark />
      </div>
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
                  if ("actions" === columnKey) {
                    return (
                      <TableCell>
                        <UpdateDeleteBookmark bookmark={item} />
                      </TableCell>
                    );
                  }

                  return <TableCell>{getKeyValue(item, columnKey)}</TableCell>;
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
