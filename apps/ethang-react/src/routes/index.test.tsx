import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./index.tsx";

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: () => {
      // eslint-disable-next-line unicorn/consistent-function-scoping
      return (config: { component: React.ComponentType }) => {
        return {
          component: config.component
        };
      };
    }
  };
});

vi.mock("../components/layout/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("../components/profile-card.tsx", () => {
  return {
    ProfileCard: () => {
      return <div data-testid="profile-card">Profile Card Content</div>;
    }
  };
});

describe("Index Route", () => {
  it("renders MainLayout and ProfileCard", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(screen.getByTestId("profile-card")).toBeDefined();
    expect(screen.getByText("Profile Card Content")).toBeDefined();
  });
});
