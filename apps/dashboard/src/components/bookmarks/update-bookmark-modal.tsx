import type { Bookmark } from "@ethang/schemas/src/dashboard/bookmark-schema.ts";
import type { FormEvent } from "react";

import { useUser } from "@clerk/clerk-react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil";
import { z } from "zod";

import { queryKeys } from "../../data/queries/queries.ts";
import { modalStore, useModalStore } from "../../global-stores/modal-store.ts";

export const UpdateBookmarkModal = () => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const bookmark = useModalStore((state) => {
    return state.bookmarkToUpdate;
  });

  const isOpen = useModalStore((state) => {
    return state.updateBookmark;
  });

  const handleChange = (key: keyof Bookmark) => (value: string) => {
    if (isNil(bookmark)) {
      return;
    }

    modalStore.setBookmarkToUpdate({
      ...bookmark,
      [key]: value,
    });
  };

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: Bookmark) => {
      const response = await fetch("/api/bookmark", {
        body: JSON.stringify(data),
        method: "PUT",
      });

      if (response.ok) {
        await queryClient.invalidateQueries({
          queryKey: queryKeys.bookmarks(user?.id),
        });
        modalStore.closeModal("updateBookmark");
      }
    },
  });

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
          modalStore.setBookmarkToUpdate(null);
        }
        modalStore.setIsModalOpen("updateBookmark", value);
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
                modalStore.closeModal("updateBookmark");
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
