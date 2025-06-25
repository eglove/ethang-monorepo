import type { Bookmark } from "@ethang/schemas/dashboard/bookmark-schema.ts";

import { useStore } from "@ethang/store/use-store";
import { Button } from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { authStore } from "../../stores/auth-store.ts";
import { bookmarkStore } from "../../stores/bookmark-store.ts";

type UpdateDeleteBookmarkProperties = {
  bookmark: Bookmark;
};

export const UpdateDeleteBookmark = ({
  bookmark,
}: Readonly<UpdateDeleteBookmarkProperties>) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const userId = useStore(authStore, (state) => state.userId);

  const { isPending, mutate } = useMutation(
    bookmarkStore.deleteBookmark(userId ?? undefined, () => {
      setIsDeleting(false);
    }),
  );

  return (
    <div className="flex gap-2 items-center">
      {!isDeleting && (
        <>
          <Button
            isIconOnly
            onPress={() => {
              bookmarkStore.setBookmarkToUpdate(bookmark);
              bookmarkStore.setIsUpdateModalOpen(true);
            }}
            aria-label="Update bookmark"
            color="primary"
            size="sm"
          >
            <PencilIcon />
          </Button>
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
              mutate(bookmark);
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
