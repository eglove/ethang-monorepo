import type { Bookmark } from "@ethang/schemas/dashboard/bookmark-schema.ts";

import { useMutation } from "@apollo/client";
import { Button } from "@heroui/react";
import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { deleteBookmark } from "../../graphql/mutations/delete-bookmark.ts";
import { getAllBookmarks } from "../../graphql/queries/get-all-bookmarks.ts";
import { bookmarkStore } from "../../stores/bookmark-store.ts";

type UpdateDeleteBookmarkProperties = {
  bookmark: Bookmark;
};

export const UpdateDeleteBookmark = ({
  bookmark,
}: Readonly<UpdateDeleteBookmarkProperties>) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const [handleDelete, { loading }] = useMutation(deleteBookmark);

  return (
    <div className="flex items-center gap-2">
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
            isLoading={loading}
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
              handleDelete({
                onCompleted: () => {
                  setIsDeleting(false);
                },
                refetchQueries: [getAllBookmarks],
                variables: {
                  input: {
                    id: bookmark.id,
                  },
                },
              }).catch(globalThis.console.error);
            }}
            aria-label="Confirm delete"
            color="danger"
            isLoading={loading}
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
            isLoading={loading}
            size="sm"
          >
            <XIcon />
          </Button>
        </>
      )}
    </div>
  );
};
