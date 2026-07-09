import type { ReactNode } from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authStore, authStoreActions } from "../auth/auth-store.ts";
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
    authStoreActions.signOut();
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

  it("should render user welcome and logout button when authenticated", async () => {
    const mockUser = {
      email: "test@ethang.email",
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    authStore.update((draft) => {
      draft.error = null;
      draft.isPending = false;
      draft.user = mockUser;
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

  it("should trigger signOut when logout button is clicked", async () => {
    const mockUser = {
      email: "test@ethang.email",
      sessionToken: "mock-session-token",
      username: "testuser"
    };

    authStore.update((draft) => {
      draft.error = null;
      draft.isPending = false;
      draft.user = mockUser;
    });

    const signOutSpy = vi.spyOn(authStoreActions, "signOut");

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
