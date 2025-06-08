import type { Bookmark } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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
import { useMutation } from "@tanstack/react-query";
import isNil from "lodash/isNil";
import { z } from "zod";

import { bookmarkStore } from "../../stores/bookmark-store.ts";

export const UpdateBookmarkModal = () => {
  const { user } = useUser();

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

  const { isPending, mutate } = useMutation(
    bookmarkStore.updateBookmark(user?.id),
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({ title: z.string(), url: z.string() })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(bookmark?.id) || isNil(user?.id) || !parsed.success) {
      return;
    }

    mutate({
      id: bookmark.id,
      title: parsed.data.title,
      url: parsed.data.url,
      userId: user.id,
    });
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
                const parsed = z.string().url().safeParse(value);

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
            <Button color="primary" isLoading={isPending} type="submit">
              Update
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
