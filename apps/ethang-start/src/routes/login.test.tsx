import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import noop from "lodash/noop.js";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Route } from "./login.tsx";

const TEST_EMAIL = "test@ethang.email";
// eslint-disable-next-line sonar/no-hardcoded-passwords
const TEST_PASSWORD = "password123";
const EMAIL_INPUT_TEST_ID = "input-email";
// eslint-disable-next-line sonar/no-hardcoded-passwords
const PASSWORD_INPUT_TEST_ID = "input-password";
const SUBMIT_BUTTON_TEST_ID = "login-button";
const FAILED_MESSAGE = "Failed to sign in";

const {
  mockGetAuthState,
  mockNavigate,
  mockRouteConfig,
  mockSearchStore,
  mockSignIn
} = vi.hoisted(() => {
  const navigateMock = vi.fn(async () => {
    noop();
  });
  const searchStore = { search: { redirect: null as null | string } };
  const getAuthStateMock = vi.fn(async () => {
    return { isAuthenticated: false };
  });
  const signInMock = vi.fn(async () => {
    return {
      success: { email: TEST_EMAIL, sessionToken: "tok", username: "u" }
    };
  });
  return {
    mockGetAuthState: getAuthStateMock,
    mockNavigate: navigateMock,
    mockRouteConfig: (config: { component: React.ComponentType }) => {
      return {
        options: { component: config.component }
      };
    },
    mockSearchStore: searchStore,
    mockSignIn: signInMock
  };
});

vi.mock("../models/auth.ts", () => {
  return {
    getAuthState: mockGetAuthState,
    signIn: mockSignIn
  };
});

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: () => {
      return mockRouteConfig;
    },
    redirect: () => {
      return {};
    },
    useNavigate: () => {
      return mockNavigate;
    },
    useSearch: () => {
      return mockSearchStore.search;
    }
  };
});

vi.mock("@astryxdesign/core", () => {
  return {
    Button: ({
      isDisabled,
      isLoading,
      label,
      type
    }: {
      isDisabled?: boolean;
      isLoading?: boolean;
      label: string;
      type?: "button" | "reset" | "submit";
    }) => {
      const isDisabledButton = (isDisabled ?? false) || (isLoading ?? false);
      return (
        <button
          type={type}
          disabled={isDisabledButton}
          data-testid={SUBMIT_BUTTON_TEST_ID}
        >
          {label}
        </button>
      );
    },
    Card: ({
      children,
      maxWidth
    }: {
      children: React.ReactNode;
      maxWidth?: number;
    }) => {
      return (
        <div style={{ maxWidth }} data-testid="login-card">
          {children}
        </div>
      );
    },
    Field: ({
      children,
      inputID,
      label
    }: {
      children: React.ReactNode;
      inputID: string;
      label: string;
    }) => {
      return (
        <div data-testid={`field-${inputID}`}>
          <label htmlFor={inputID}>{label}</label>
          {children}
        </div>
      );
    },
    Heading: ({
      align,
      children,
      level
    }: {
      align?: string;
      children: React.ReactNode;
      level?: number;
    }) => {
      const Tag = `h${level ?? 1}` as React.ElementType;
      return <Tag style={{ textAlign: align }}>{children}</Tag>;
    },
    Text: ({ children }: { children?: React.ReactNode }) => {
      return <span data-testid="text-error">{children}</span>;
    },
    TextInput: ({
      id,
      onChange,
      placeholder,
      type,
      value
    }: {
      id: string;
      onChange?: (value: string) => void;
      placeholder?: string;
      type?: string;
      value: string;
    }) => {
      return (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          data-testid={`input-${id}`}
          onChange={(event) => {
            return onChange?.(event.target.value);
          }}
        />
      );
    },
    VStack: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="vstack">{children}</div>;
    }
  };
});

describe("Login Route", () => {
  afterEach(() => {
    vi.clearAllMocks();
    mockSearchStore.search = { redirect: null };
  });

  it("renders the login heading", async () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByRole("heading", { level: 3 })).toBeDefined();
    expect(screen.getByText(/sign in to your account/iu)).toBeDefined();
  });

  it("renders email and password inputs", async () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByTestId(EMAIL_INPUT_TEST_ID)).toBeDefined();
    expect(screen.getByTestId(PASSWORD_INPUT_TEST_ID)).toBeDefined();
  });

  it("renders a submit button", async () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByTestId(SUBMIT_BUTTON_TEST_ID)).toBeDefined();
    expect(screen.getByRole("button", { name: /sign in$/iu })).toBeDefined();
  });

  it("shows error text when login fails", async () => {
    mockSignIn.mockResolvedValue({ failure: new Error(FAILED_MESSAGE) });

    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);

    const emailInput = screen.getByTestId(EMAIL_INPUT_TEST_ID);
    const passwordInput = screen.getByTestId(PASSWORD_INPUT_TEST_ID);
    const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);

    await userEvent.type(emailInput, TEST_EMAIL);
    await userEvent.type(passwordInput, TEST_PASSWORD);
    await userEvent.click(submitButton);

    expect(screen.getByText(/failed to sign in/iu)).toBeDefined();
  });

  it("does not submit when email or password is empty", async () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);

    const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);
    await userEvent.click(submitButton);

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("shows loading state while submitting", async () => {
    const { promise, resolve } = Promise.withResolvers<{
      success: { email: string; sessionToken: string; username: string };
    }>();
    mockSignIn.mockReturnValue(promise);

    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);

    const emailInput = screen.getByTestId(EMAIL_INPUT_TEST_ID);
    const passwordInput = screen.getByTestId(PASSWORD_INPUT_TEST_ID);
    const submitButton = screen.getByTestId(SUBMIT_BUTTON_TEST_ID);

    await userEvent.type(emailInput, TEST_EMAIL);
    await userEvent.type(passwordInput, TEST_PASSWORD);
    await userEvent.click(submitButton);

    expect(screen.getByRole("button", { name: /signing in/iu })).toBeDefined();
    expect(submitButton).toHaveProperty("disabled", true);

    resolve({
      success: { email: TEST_EMAIL, sessionToken: "tok", username: "u" }
    });
  });
});
