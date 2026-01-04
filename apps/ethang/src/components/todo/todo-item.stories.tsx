import type { Meta, StoryObj } from "@storybook/react-vite";

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
};
