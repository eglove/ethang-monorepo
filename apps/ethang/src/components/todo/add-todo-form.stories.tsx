import type { Meta, StoryObj } from "@storybook/react-vite";

import { AddTodoForm } from "./add-todo-form.tsx";

const meta = {
  component: AddTodoForm,
} satisfies Meta<typeof AddTodoForm>;

export default meta;

type Story = StoryObj<typeof AddTodoForm>;

export const Default: Story = {};
