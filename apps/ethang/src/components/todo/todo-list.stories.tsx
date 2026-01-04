import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "@storybook/test";
import map from "lodash/map.js";
import { useEffect } from "react";

import { todoStore } from "../../stores/todo-store.ts";
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
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    const todoItems = await canvas.findAllByLabelText("Todo title");
    await expect(todoItems).toHaveLength(2);
  },
  render: (arguments_) => {
    useEffect(() => {
      todoStore.setTodos(
        map(arguments_.todos, (todo, index) => {
          return {
            completed: false,
            id: todo.id,
            title: `Todo ${index + 1}`,
          };
        }),
      );
    }, [arguments_.todos]);

    return <TodoList {...arguments_} />;
  },
};

export const Empty: Story = {
  args: {
    todos: [],
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    const todoItems = canvas.queryAllByLabelText("Todo title");
    await expect(todoItems).toHaveLength(0);
  },
  render: (arguments_) => {
    useEffect(() => {
      todoStore.setTodos([]);
    }, []);

    return <TodoList {...arguments_} />;
  },
};
