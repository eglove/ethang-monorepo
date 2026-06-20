import type { ComponentType, ReactNode } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore } from "../components/auth/auth-store.ts";
import { Route } from "./login.tsx";

const TEST_EMAIL = "test@ethang.email";
// eslint-disable-next-line sonar/no-hardcoded-passwords
const TEST_PASSWORD = "password123";

// Mock the TanStack Router hooks
const mockNavigate = vi.fn(async () => {
  //
});
const mockSearchStore = {
  search: { redirect: undefined as string | undefined }
};
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@tanstack/react-router"
  );
  return {
    ...actual,
    createFileRoute: (path: string) => {
      return (options: { component: ComponentType }) => {
        return {
          options,
          path,
          useSearch: () => {
            return mockSearchStore.search;
          }
        };
      };
    },
    Link: ({
      children,
      href
    }: Readonly<{ children: ReactNode; href: string }>) => {
      return <a href={href}>{children}</a>;
    },
    useNavigate: () => {
      return mockNavigate;
    },
    useSearch: () => {
      return mockSearchStore.search;
    }
  };
});

describe("Login Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.reset();
    vi.restoreAllMocks();
    mockNavigate.mockClear();
    mockSearchStore.search = { redirect: undefined as string | undefined };
  });

  it("should render the login form and handle successful authentication", async () => {
    const mockUser = {
      email: TEST_EMAIL,
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(mockUser, { status: 200 }));

    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const emailInput = screen.getByPlaceholderText(/enter your email/iu);
    const passwordInput = screen.getByPlaceholderText(/enter your password/iu);
    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    fireEvent.change(emailInput, { target: { value: TEST_EMAIL } });
    fireEvent.change(passwordInput, { target: { value: TEST_PASSWORD } });

    fireEvent.click(submitButton);

    expect(screen.getByRole("button")).toHaveProperty("disabled", true);
    expect(screen.getByText(/signing in\.\.\./iu)).toBeDefined();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/" });
    });
  });

  it("should navigate to redirect path if redirect search param is present", async () => {
    mockSearchStore.search = { redirect: "/rss" };

    const mockUser = {
      email: TEST_EMAIL,
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json(mockUser, { status: 200 }));

    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const emailInput = screen.getByPlaceholderText(/enter your email/iu);
    const passwordInput = screen.getByPlaceholderText(/enter your password/iu);
    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    fireEvent.change(emailInput, { target: { value: TEST_EMAIL } });
    fireEvent.change(passwordInput, { target: { value: TEST_PASSWORD } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/rss" });
    });
  });

  it("should show error message on failed login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { error: "Invalid Credentials" },
        {
          status: 401
        }
      )
    );

    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const emailInput = screen.getByPlaceholderText(/enter your email/iu);
    const passwordInput = screen.getByPlaceholderText(/enter your password/iu);
    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    fireEvent.change(emailInput, { target: { value: TEST_EMAIL } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/iu)).toBeDefined();
    });

    expect(screen.getByRole("button", { name: /sign in/iu })).toHaveProperty(
      "disabled",
      false
    );
  });

  it("should not call signIn if email or password are empty or whitespace", () => {
    const signInSpy = vi.spyOn(authStore, "signIn");

    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    // Submit without filling inputs (or whitespace only)
    fireEvent.click(submitButton);

    expect(signInSpy).not.toHaveBeenCalled();
  });

  it("should not call signIn if email is filled but password is empty", () => {
    const signInSpy = vi.spyOn(authStore, "signIn");

    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const emailInput = screen.getByPlaceholderText(/enter your email/iu);
    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    fireEvent.change(emailInput, { target: { value: TEST_EMAIL } });
    fireEvent.click(submitButton);

    expect(signInSpy).not.toHaveBeenCalled();
  });

  it("should not call signIn if email is empty but password is filled", () => {
    const signInSpy = vi.spyOn(authStore, "signIn");

    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/iu);
    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    fireEvent.change(passwordInput, { target: { value: TEST_PASSWORD } });
    fireEvent.click(submitButton);

    expect(signInSpy).not.toHaveBeenCalled();
  });

  describe("validateSearch", () => {
    it("should validate and return redirect as a string if redirect is a string", () => {
      // @ts-expect-error for test
      const result = Route.options.validateSearch?.({ redirect: "/rss" });
      expect(result).toEqual({ redirect: "/rss" });
    });

    it("should return empty string if redirect is not a string", () => {
      // @ts-expect-error for test
      const result1 = Route.options.validateSearch?.({ redirect: 123 });
      expect(result1).toEqual({ redirect: "" });

      // @ts-expect-error for test
      const result2 = Route.options.validateSearch?.({});
      expect(result2).toEqual({ redirect: "" });
    });
  });
});
