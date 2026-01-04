import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, within } from "@storybook/test";

import { TypographyH1 } from "./typography-h1";

const meta = {
  component: TypographyH1,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TypographyH1>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Typography H1",
  },
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("Typography H1")).toBeInTheDocument();
  },
};
