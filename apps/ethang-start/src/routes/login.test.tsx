import { render, screen } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Route } from "./login.tsx";

const { mockNavigate, mockSearchStore, mockRouteConfig } = vi.hoisted(() => {
  const navigateMock = vi.fn(async () => {});
  const searchStore = { search: { redirect: null as null | string } };
  return {
    mockNavigate: navigateMock,
    mockSearchStore: searchStore,
    mockRouteConfig: (config: { component: React.ComponentType }) => ({
      options: { component: config.component }
    })
  };
});

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: () => {
      return mockRouteConfig;
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
      label,
      type,
      isLoading,
      isDisabled
    }: {
      label: string;
      type?: "button" | "submit" | "reset";
      isLoading?: boolean;
      isDisabled?: boolean;
    }) => {
      return (
        <button data-testid="login-button" disabled={isDisabled || isLoading} type={type}>
          {label}
        </button>
      );
    },
    Card: ({ children, maxWidth }: { children: React.ReactNode; maxWidth?: number }) => {
      return (
        <div data-testid="login-card" style={{ maxWidth }}>
          {children}
        </div>
      );
    },
    Field: ({ label, inputID, children }: { label: string; inputID: string; children: React.ReactNode }) => {
      return (
        <div data-testid={`field-${inputID}`}>
          <label htmlFor={inputID}>{label}</label>
          {children}
        </div>
      );
    },
    Heading: ({ level, align, children }: { level?: number; align?: string; children: React.ReactNode }) => {
      const Tag = `h${level ?? 1}` as React.ElementType;
      return <Tag style={{ textAlign: align }}>{children}</Tag>;
    },
    TextInput: ({
      id,
      type,
      value,
      placeholder,
      onChange
    }: {
      id: string;
      type?: string;
      value: string;
      placeholder?: string;
      onChange?: (value: string) => void;
    }) => {
      return (
        <input
          data-testid={`input-${id}`}
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
        />
      );
    },
    Text: ({ children }: { children?: React.ReactNode }) => {
      return <span data-testid="text-error">{children}</span>;
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
    expect(screen.getByTestId("input-email")).toBeDefined();
    expect(screen.getByTestId("input-password")).toBeDefined();
  });

  it("renders a submit button", async () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByTestId("login-button")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /sign in$/iu })
    ).toBeDefined();
  });

  it("shows error text when login fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("Failed to sign in"));

    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);

    const emailInput = screen.getByTestId("input-email");
    const passwordInput = screen.getByTestId("input-password");
    const submitButton = screen.getByTestId("login-button");

    await userEvent.type(emailInput, "test@ethang.email");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    expect(screen.getByText(/failed to sign in/iu)).toBeDefined();
  });

  it("does not submit when email or password is empty", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);

    const submitButton = screen.getByTestId("login-button");
    await userEvent.click(submitButton);

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows loading state while submitting", async () => {
    let resolveFetch: (() => void) | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);

    const emailInput = screen.getByTestId("input-email");
    const passwordInput = screen.getByTestId("input-password");
    const submitButton = screen.getByTestId("login-button");

    await userEvent.type(emailInput, "test@ethang.email");
    await userEvent.type(passwordInput, "password123");
    await userEvent.click(submitButton);

    expect(screen.getByText(/signing in\.\.\./iu)).toBeDefined();
    expect(submitButton).toHaveProperty("disabled", true);

    resolveFetch?.();
  });
});
