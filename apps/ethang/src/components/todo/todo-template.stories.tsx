import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "@storybook/test";

import { TodoTemplate } from "./todo-template.tsx";

const meta = {
  component: TodoTemplate,
} satisfies Meta<typeof TodoTemplate>;

export default meta;

type Story = StoryObj<typeof TodoTemplate>;

export const Default: Story = {
  args: {
    addTodoForm: <div data-testid="add-todo-form">AddTodoForm</div>,
    todoList: <div data-testid="todo-list">TodoList</div>,
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByTestId("add-todo-form")).toBeInTheDocument();
    await expect(canvas.getByTestId("todo-list")).toBeInTheDocument();
  },
};
