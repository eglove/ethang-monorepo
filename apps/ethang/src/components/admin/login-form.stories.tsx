import type { Meta, StoryObj } from "@storybook/react-vite";

import { expect, userEvent, within } from "@storybook/test";

import { LoginForm } from "./login-form";

const meta = {
  component: LoginForm,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const emailInput = canvas.getByLabelText(/email/iu);
    const passwordInput = canvas.getByLabelText(/password/iu);
    const submitButton = canvas.getByRole("button", { name: /login/iu });

    await userEvent.type(emailInput, "hello@ethang.email");
    await userEvent.type(passwordInput, "password");

    await expect(emailInput).toHaveValue("hello@ethang.email");
    await expect(passwordInput).toHaveValue("password");

    // We can't easily test the actual fetch here without MSW or similar,
    // but we can test that the button is clickable.
    await userEvent.click(submitButton);
  },
};
