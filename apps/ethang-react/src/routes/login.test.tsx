import type { ComponentType, ReactNode } from "react";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore } from "../components/auth/auth-store.ts";
import { Route } from "./login.tsx";

const TEST_EMAIL = "test@ethang.email";
const TEST_PASSWORD = "password123";

// Mock the TanStack Router hooks
const mockNavigate = vi.fn(async () => {
  //
});
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    "@tanstack/react-router"
  );
  return {
    ...actual,
    createFileRoute: (path: string) => {
      return (options: { component: ComponentType }) => {
        return { options, path };
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
    }
  };
});

describe("Login Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.reset();
    vi.restoreAllMocks();
    mockNavigate.mockClear();
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

  it("should show error message on failed login", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        { error: "Invalid Credentials" },
        {
          status: 401
        }
      )
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    // Submit without filling inputs (or whitespace only)
    fireEvent.click(submitButton);

    expect(signInSpy).not.toHaveBeenCalled();
  });

  it("should not call signIn if email is filled but password is empty", () => {
    const signInSpy = vi.spyOn(authStore, "signIn");

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
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

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const LoginComponent = Route.options.component as ComponentType;
    render(<LoginComponent />);

    const passwordInput = screen.getByPlaceholderText(/enter your password/iu);
    const submitButton = screen.getByRole("button", { name: /sign in/iu });

    fireEvent.change(passwordInput, { target: { value: TEST_PASSWORD } });
    fireEvent.click(submitButton);

    expect(signInSpy).not.toHaveBeenCalled();
  });
});
