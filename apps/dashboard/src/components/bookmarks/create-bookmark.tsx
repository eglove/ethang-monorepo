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
  useDisclosure,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import { PlusIcon } from "lucide-react";
import { z } from "zod";

import { queryKeys } from "../../data/queries/queries.ts";

export const CreateBookmark = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure();

  const { isPending, mutate } = useMutation({
    mutationFn: async (data: { title: string; url: string }) => {
      await globalThis.fetch("/api/bookmark", {
        body: JSON.stringify({
          title: data.title,
          url: data.url,
          userId: user?.id,
        }),
        method: "POST",
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.bookmarks(user?.id),
      });
      onClose();
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
    <>
      <Button
        isIconOnly
        aria-label="Add Bookmark"
        color="primary"
        onPress={onOpen}
        size="sm"
      >
        <PlusIcon />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => {
            return (
              <>
                <ModalHeader>Add Bookmark</ModalHeader>
                <Form className="grid gap-2" onSubmit={handleSubmit}>
                  <ModalBody>
                    <Input
                      isRequired
                      errorMessage={({ validationErrors }) => {
                        return validationErrors;
                      }}
                      label="Title"
                      name="title"
                    />
                    <Input
                      isRequired
                      errorMessage={({ validationErrors }) => {
                        return validationErrors;
                      }}
                      validate={(value) => {
                        const parsed = z.string().url().safeParse(value);

                        if (!parsed.success) {
                          return "Invalid url";
                        }

                        return null;
                      }}
                      label="URL"
                      name="url"
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" onPress={onClose} variant="light">
                      Close
                    </Button>
                    <Button color="primary" isLoading={isPending} type="submit">
                      Create
                    </Button>
                  </ModalFooter>
                </Form>
              </>
            );
          }}
        </ModalContent>
      </Modal>
    </>
  );
};
