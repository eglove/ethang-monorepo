import type { ReactNode } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore } from "../auth/auth-store.ts";
import { MainLayout } from "./main-layout.tsx";

// Mock the TanStack Router hooks and components
vi.mock("@tanstack/react-router", () => {
  return {
    Link: ({ children, to }: Readonly<{ children: ReactNode; to: string }>) => {
      return <a href={to}>{children}</a>;
    }
  };
});

describe("MainLayout Navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    authStore.reset();
    vi.restoreAllMocks();
  });

  it("should render navigation links and login link when not authenticated", () => {
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText("Home")).toBeDefined();
    expect(screen.getByText("Blog")).toBeDefined();
    expect(screen.getByText("Tips")).toBeDefined();
    expect(screen.getByText("Courses")).toBeDefined();
    expect(screen.getByRole("link", { name: "Login" })).toBeDefined();
    expect(screen.queryByText(/logged in as/iu)).toBeNull();
  });

  it("should render user welcome and logout button when authenticated", () => {
    const mockUser = {
      email: "test@ethang.email",
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    authStore.reset({
      error: null,
      isPending: false,
      user: mockUser
    });

    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText("testuser")).toBeDefined();
    expect(screen.getByRole("button", { name: "Logout" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Login" })).toBeNull();
  });

  it("should trigger signOut when logout button is clicked", () => {
    const mockUser = {
      email: "test@ethang.email",
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    authStore.reset({
      error: null,
      isPending: false,
      user: mockUser
    });

    const signOutSpy = vi.spyOn(authStore, "signOut");

    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    const logoutButton = screen.getByRole("button", { name: "Logout" });
    fireEvent.click(logoutButton);

    expect(signOutSpy).toHaveBeenCalled();
  });
});
