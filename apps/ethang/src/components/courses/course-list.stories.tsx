import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApolloProvider } from "@apollo/client/react";

import { apolloClient } from "../../graphql/client.ts";
import { CourseList } from "./course-list";

const meta = {
  component: CourseList,
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
} satisfies Meta<typeof CourseList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pathId: "path-1",
  },
};
