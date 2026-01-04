import type { Meta, StoryObj } from "@storybook/react-vite";

import { TodoTemplate } from "./todo-template.tsx";

const meta = {
  component: TodoTemplate,
} satisfies Meta<typeof TodoTemplate>;

export default meta;

type Story = StoryObj<typeof TodoTemplate>;

export const Default: Story = {
  args: {
    addTodoForm: "AddTodoForm placeholder",
    todoList: "TodoList placeholder",
  },
};
