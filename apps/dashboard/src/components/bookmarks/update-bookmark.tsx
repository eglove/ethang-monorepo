import type { Bookmark } from "@ethang/schemas/src/dashboard/bookmark.ts";

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
import isNil from "lodash/isNil";
import { PencilIcon } from "lucide-react";
import { type FormEvent, useState } from "react";
import { z } from "zod";

import { queryKeys } from "../../data/queries/queries.ts";

type UpdateBookmarkProperties = {
  bookmark: Bookmark;
};

export const UpdateBookmark = ({
  bookmark,
}: Readonly<UpdateBookmarkProperties>) => {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure();

  const [formState, setFormState] = useState({
    title: bookmark.title,
    url: bookmark.url,
  });

  const handleChange = (key: keyof typeof formState) => (value: string) => {
    setFormState((previous) => {
      return {
        ...previous,
        [key]: value,
      };
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
        onClose();
      }
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
      id: bookmark.id,
      title: parsed.data.title,
      url: parsed.data.url,
      userId: user.id,
    });
  };

  return (
    <>
      <Button
        isIconOnly
        aria-label="Update bookmark"
        color="primary"
        onPress={onOpen}
        size="sm"
      >
        <PencilIcon />
      </Button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {() => {
            return (
              <>
                <ModalHeader>Update Bookmark</ModalHeader>
                <Form className="grid gap-2" onSubmit={handleSubmit}>
                  <ModalBody>
                    <Input
                      isRequired
                      errorMessage={({ validationErrors }) => {
                        return validationErrors;
                      }}
                      label="Title"
                      name="title"
                      onValueChange={handleChange("title")}
                      value={formState.title}
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
                      onValueChange={handleChange("url")}
                      value={formState.url}
                    />
                  </ModalBody>
                  <ModalFooter>
                    <Button color="danger" onPress={onClose} variant="light">
                      Close
                    </Button>
                    <Button color="primary" isLoading={isPending} type="submit">
                      Update
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
