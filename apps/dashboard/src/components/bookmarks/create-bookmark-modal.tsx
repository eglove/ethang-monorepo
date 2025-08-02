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

import { createBookmark } from "../../graphql/mutations/create-bookmark.ts";
import { getAllBookmarks } from "../../graphql/queries/get-all-bookmarks.ts";
import { authStore } from "../../stores/auth-store.ts";
import { bookmarkStore } from "../../stores/bookmark-store.ts";

export const CreateBookmarkModal = () => {
  const userId = useStore(authStore, (state) => state.userId);
  const isCreateBookmarkOpen = useStore(
    bookmarkStore,
    (snapshot) => snapshot.isCreateModalOpen,
  );

  const [addBookmark, { loading }] = useMutation(createBookmark);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = z
      .object({ title: z.string(), url: z.string() })
      .safeParse(Object.fromEntries(new FormData(event.currentTarget)));

    if (isNil(userId) || !parsed.success) {
      return;
    }

    addBookmark({
      onCompleted: () => {
        bookmarkStore.setIsCreateModalOpen(false);
      },
      refetchQueries: [getAllBookmarks],
      variables: {
        input: {
          title: parsed.data.title,
          url: parsed.data.url,
        },
      },
    }).catch(globalThis.console.error);
  };

  return (
    <Modal
      onOpenChange={(value) => {
        bookmarkStore.setIsCreateModalOpen(value);
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
                bookmarkStore.setIsCreateModalOpen(false);
              }}
              color="danger"
              variant="light"
            >
              Close
            </Button>
            <Button color="primary" isLoading={loading} type="submit">
              Create
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};
