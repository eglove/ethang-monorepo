import type { Meta, StoryObj } from "@storybook/react-vite";

import { TodoList } from "./todo-list.tsx";

const meta = {
  component: TodoList,
} satisfies Meta<typeof TodoList>;

export default meta;

type Story = StoryObj<typeof TodoList>;

export const Default: Story = {
  args: {
    todos: [{ id: "1" }, { id: "2" }],
  },
};

export const Empty: Story = {
  args: {
    todos: [],
  },
};
