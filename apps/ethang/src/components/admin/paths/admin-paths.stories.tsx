import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApolloProvider } from "@apollo/client/react";
import { expect, within } from "@storybook/test";

import { apolloClient } from "../../../graphql/client.ts";
import { AdminPaths } from "./admin-paths";

const meta = {
  component: AdminPaths,
  decorators: [
    (Story) => {
      return (
        <ApolloProvider client={apolloClient}>
          <Story />
        </ApolloProvider>
      );
    },
  ],
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
