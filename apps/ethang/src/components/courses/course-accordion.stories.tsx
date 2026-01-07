import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApolloProvider } from "@apollo/client/react";

import { apolloClient } from "../../graphql/client.ts";
import { CoursesContainer } from "./courses-container.tsx";

const meta = {
  component: CoursesContainer,
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
} satisfies Meta<typeof CoursesContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pathIds: ["path-1", "path-2"],
  },
};
