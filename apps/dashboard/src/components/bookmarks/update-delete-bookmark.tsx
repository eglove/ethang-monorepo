import type { Bookmark } from "@ethang/schemas/src/dashboard/bookmark.ts";

import { Button } from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { queryKeys } from "../../data/queries/queries.ts";
import { getToken } from "../../utilities/token.ts";
import { UpdateBookmark } from "./update-bookmark.tsx";

type UpdateDeleteBookmarkProperties = {
  bookmark: Bookmark;
};

export const UpdateDeleteBookmark = ({
  bookmark,
}: Readonly<UpdateDeleteBookmarkProperties>) => {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const { isPending, mutate } = useMutation({
    mutationFn: async () => {
      const response = await globalThis.fetch("/api/bookmark", {
        body: JSON.stringify({ id: bookmark.id, userId: bookmark.userId }),
        headers: {
          Authorization: getToken(),
        },
        method: "DELETE",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.bookmarks(bookmark.userId),
        });
        setIsDeleting(false);
      }
    },
  });

  return (
    <div className="flex gap-2 items-center">
      {!isDeleting && (
        <>
          <UpdateBookmark bookmark={bookmark} />
          <Button
            isIconOnly
            onPress={() => {
              setIsDeleting(true);
            }}
            aria-label="Delete"
            color="danger"
            isLoading={isPending}
            size="sm"
          >
            <Trash2Icon />
          </Button>
        </>
      )}
      {isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              mutate();
            }}
            aria-label="Confirm delete"
            color="danger"
            isLoading={isPending}
            size="sm"
          >
            <CheckIcon />
          </Button>
          <Button
            isIconOnly
            onPress={() => {
              setIsDeleting(false);
            }}
            aria-label="Cancel delete"
            isLoading={isPending}
            size="sm"
          >
            <XIcon />
          </Button>
        </>
      )}
    </div>
  );
};
