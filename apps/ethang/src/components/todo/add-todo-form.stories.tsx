import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "@storybook/test";

import { AddTodoForm } from "./add-todo-form.tsx";

const meta = {
  component: AddTodoForm,
  parameters: {
    a11y: {
      disable: true,
    },
  },
} satisfies Meta<typeof AddTodoForm>;

export default meta;

type Story = StoryObj<typeof AddTodoForm>;

export const Default: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByLabelText("New todo title");
    const addButton = canvas.getByRole("button", {
      name: "Add",
    });

    await userEvent.type(input, "Test Storybook Play");
    await expect(input).toHaveValue("Test Storybook Play");

    await userEvent.click(addButton);
    await expect(input).toHaveValue("");
  },
};
