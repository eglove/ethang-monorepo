import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "@storybook/test";

import { todoStore } from "../../stores/todo-store.ts";
import { TodoItem } from "./todo-item.tsx";

const meta = {
  component: TodoItem,
} satisfies Meta<typeof TodoItem>;

export default meta;

type Story = StoryObj<typeof TodoItem>;

export const Default: Story = {
  args: {
    id: "1",
  },
  loaders: [
    () => {
      todoStore.addTodo("Test Todo");
      const { id } = todoStore.state.todos[0]!;
      return { id };
    },
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    const checkboxes = await canvas.findAllByLabelText("Toggle todo");
    const checkbox = checkboxes[0];
    const inputs = await canvas.findAllByLabelText("Todo title");
    const input = inputs[0];

    await expect(checkbox).not.toBeChecked();
    await expect(input).toHaveValue("Test Todo");
  },
  render: (arguments_, { loaded: { id } }) => {
    return <TodoItem {...arguments_} id={id} />;
  },
};
