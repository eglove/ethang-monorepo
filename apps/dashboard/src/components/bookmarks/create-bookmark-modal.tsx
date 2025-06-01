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
import { getToken } from "../../utilities/token.ts";

export const CreateBookmarkModal = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const isCreateBookmarkOpen = useModalStore(
    (snapshot) => snapshot.createBookmark,
  );

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: { title: string; url: string }) => {
      await globalThis.fetch("/api/bookmark", {
        body: JSON.stringify({
          title: data.title,
          url: data.url,
          userId: user?.id,
        }),
        headers: {
          Authorization: getToken(),
        },
        method: "POST",
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bookmarks(user?.id),
      });
      modalStore.closeModal("createBookmark");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({ title: z.string(), url: z.string() })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(user?.id) || !parsed.success) {
      return;
    }

    mutate({
      title: parsed.data.title,
      url: parsed.data.url,
    });
  };

  return (
    <Modal
      onOpenChange={(value) => {
        modalStore.setIsModalOpen("createBookmark", value);
      }}
      isOpen={isCreateBookmarkOpen}
      scrollBehavior="outside"
    >
      <ModalContent>
        <ModalHeader>Add Bookmark</ModalHeader>
        <Form className="grid gap-2" onSubmit={handleSubmit}>
          <ModalBody>
            <Input isRequired label="Title" name="title" />
            <Input isRequired label="URL" name="url" type="url" />
          </ModalBody>
          <ModalFooter>
            <Button
              onPress={() => {
                modalStore.closeModal("createBookmark");
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={isPending} type="submit">
              Create
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
