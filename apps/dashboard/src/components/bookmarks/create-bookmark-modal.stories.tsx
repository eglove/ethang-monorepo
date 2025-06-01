import type { Meta } from "@storybook/react-vite";

import { Button } from "@heroui/react";
import { expect, userEvent, within } from "storybook/test";

import { StoryBookRouter } from "../../../.storybook/wrappers/story-book-router.tsx";
import { modalStore } from "../../global-stores/modal-store.ts";
import { CreateBookmarkModal } from "./create-bookmark-modal.tsx";

const meta = {
  component: CreateBookmarkModal,
} satisfies Meta<typeof CreateBookmarkModal>;

export const Default = () => {
  return (
    <StoryBookRouter>
      <Button
        onPress={() => {
          modalStore.openModal("createBookmark");
        }}
        color="primary"
      >
        Open
      </Button>
      <CreateBookmarkModal />
    </StoryBookRouter>
  );
};

Default.play = async () => {
  const canvas = within(document.documentElement);

  const openButton = await canvas.findByRole("button", { name: "Open" });
  await userEvent.click(openButton);

  const header = await canvas.findByText("Add Bookmark");
  await expect(header).toBeInTheDocument();

  const submitButton = await canvas.findByRole("button", { name: "Create" });
  await userEvent.click(submitButton);

  const fields = await canvas.findAllByText("Please fill out this field.");
  await expect(fields).toHaveLength(2);

  const titleInput = await canvas.findByRole("textbox", {
    name: "Title Title",
  });
  const urlInput = await canvas.findByRole("textbox", { name: "URL URL" });

  await userEvent.type(titleInput, "Title");
  await userEvent.type(urlInput, "not a url");

  await userEvent.click(submitButton);

  const urlError = await canvas.findByText("Please enter a URL.");
  await expect(urlError).toBeInTheDocument();

  await userEvent.clear(urlInput);
  await userEvent.type(urlInput, "https://example.com/");
  await userEvent.click(submitButton);

  const toast = await canvas.findByText("Unauthorized");
  await expect(toast).toBeInTheDocument();
};

export default meta;
