import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "@storybook/test";

import { TodoPage } from "./todo-page.tsx";

const meta = {
  component: TodoPage,
} satisfies Meta<typeof TodoPage>;

export default meta;

type Story = StoryObj<typeof TodoPage>;

export const Default: Story = {};

export const Interactions: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByLabelText("New todo title");
    const addButton = canvas.getByRole("button", {
      name: "Add",
    });

    await userEvent.type(input, "Test Storybook Play");
    await userEvent.click(addButton);

    const todoTitles = canvas.getAllByLabelText("Todo title");
    const todoTitle = todoTitles.at(-1);

    if (!(todoTitle instanceof HTMLInputElement)) {
      throw new TypeError("Todo title not found or not an input");
    }

    await expect(todoTitle).toHaveValue("Test Storybook Play");

    const checkboxes = canvas.getAllByLabelText("Toggle todo");
    const checkbox = checkboxes.at(-1);

    if (!(checkbox instanceof HTMLInputElement)) {
      throw new TypeError("Checkbox not found or not an input");
    }

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();

    const deleteButtons = canvas.getAllByLabelText("Delete todo");
    const deleteButton = deleteButtons.at(-1);

    if (!(deleteButton instanceof HTMLButtonElement)) {
      throw new TypeError("Delete button not found or not a button");
    }

    await userEvent.click(deleteButton);
    await expect(todoTitle).not.toBeInTheDocument();
  },
};
