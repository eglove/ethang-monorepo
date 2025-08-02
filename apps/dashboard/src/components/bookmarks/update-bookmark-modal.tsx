import type { Bookmark } from "@ethang/schemas/dashboard/bookmark-schema.ts";
import type { FormEvent } from "react";

import { useMutation } from "@apollo/client";
import { useStore } from "@ethang/store/use-store";
import {
  Button,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import isNil from "lodash/isNil";
import { z } from "zod";

import { updateBookmark } from "../../graphql/mutations/update-bookmark.ts";
import { getAllBookmarks } from "../../graphql/queries/get-all-bookmarks.ts";
import { authStore } from "../../stores/auth-store.ts";
import { bookmarkStore } from "../../stores/bookmark-store.ts";

export const UpdateBookmarkModal = () => {
  const userId = useStore(authStore, (state) => state.userId);

  const { bookmark, isOpen } = useStore(bookmarkStore, (state) => {
    return {
      bookmark: state.bookmarkToUpdate,
      isOpen: state.isUpdateModalOpen,
    };
  });

  const handleChange = (key: keyof Bookmark) => (value: string) => {
    if (isNil(bookmark)) {
      return;
    }

    bookmarkStore.setBookmarkToUpdate({
      ...bookmark,
      [key]: value,
    });
  };

  const [handleUpdate, { loading }] = useMutation(updateBookmark);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({ title: z.string(), url: z.string() })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(bookmark?.id) || isNil(userId) || !parsed.success) {
      return;
    }

    handleUpdate({
      onCompleted: () => {
        bookmarkStore.setIsUpdateModalOpen(false);
        bookmarkStore.setBookmarkToUpdate(null);
      },
      refetchQueries: [getAllBookmarks],
      variables: {
        input: {
          id: bookmark.id,
          title: parsed.data.title,
          url: parsed.data.url,
        },
      },
    }).catch(globalThis.console.error);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        if (!value) {
          bookmarkStore.setBookmarkToUpdate(null);
        }
        bookmarkStore.setIsUpdateModalOpen(value);
      }}
      isOpen={isOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Update Bookmark</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input
              isRequired
              label="Title"
              name="title"
              onValueChange={handleChange("title")}
              value={bookmark?.title ?? ""}
            />
            <Input
              isRequired
              validate={(value) => {
                const parsed = z.url().safeParse(value);

                if (!parsed.success) {
                  return "Invalid url";
                }

                return null;
              }}
              label="URL"
              name="url"
              onValueChange={handleChange("url")}
              value={bookmark?.url ?? ""}
            />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                bookmarkStore.setIsUpdateModalOpen(false);
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={loading} type="submit">
              Update
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
