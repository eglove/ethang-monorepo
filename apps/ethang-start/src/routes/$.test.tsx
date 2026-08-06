import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Route } from "./$.tsx";

const { mockRouteConfig } = vi.hoisted(() => {
  return {
    mockRouteConfig: (config: { component: React.ComponentType }) => {
      return {
        options: { component: config.component }
      };
    }
  };
});

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: () => {
      return mockRouteConfig;
    }
  };
});

vi.mock("../components/layouts/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("@astryxdesign/core", () => {
  return {
    Heading: ({
      children,
      level
    }: {
      children: React.ReactNode;
      level?: number;
    }) => {
      const Tag = `h${level ?? 1}` as React.ElementType;

      return <Tag>{children}</Tag>;
    },
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    },
    Text: ({ children }: { children: React.ReactNode }) => {
      return <p>{children}</p>;
    }
  };
});

describe("Catch-All 404 Route", () => {
  it("renders a 404 heading inside the main layout", () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "404" })
    ).toBeDefined();
  });

  it("renders a message and a link back home", () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByText("Page not found")).toBeDefined();
    const homeLink = screen.getByRole("link", { name: "Return home" });
    expect(homeLink.getAttribute("href")).toBe("/");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
