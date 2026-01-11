import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "@storybook/test";

import { AdminPaths } from "./admin-paths";

const meta = {
  component: AdminPaths,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof AdminPaths>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const title = canvas.getByText(/Manage Paths/iu);
    await expect(title).toBeInTheDocument();
  },
};
