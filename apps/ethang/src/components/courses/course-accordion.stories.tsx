import type { Meta, StoryObj } from "@storybook/react-vite";

import { ApolloProvider } from "@apollo/client/react";

import { apolloClient } from "../../components/providers";
import { CourseAccordion } from "./course-accordion";

const meta = {
  component: CourseAccordion,
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
} satisfies Meta<typeof CourseAccordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    pathIds: ["path-1", "path-2"],
  },
};
