import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Route } from "./$slug.tsx";

const { mockDetail, mockRouteConfig } = vi.hoisted(() => {
  const body = [{ _key: "1", _type: "block", text: "Hello body" }];

  return {
    mockDetail: {
      _id: "1",
      _updatedAt: "2024-01-01T12:00:00Z",
      body,
      slug: { current: "test-blog" },
      title: "Test Blog Title"
    },
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
    },
    useLoaderData: vi.fn(() => {
      return mockDetail;
    })
  };
});

vi.mock("../../components/layouts/main-layout.tsx", () => {
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
    }
  };
});

vi.mock("../../components/sanity-text.tsx", () => {
  return {
    SanityText: ({ value }: { value: unknown }) => {
      return <div data-testid="sanity-text">{JSON.stringify(value)}</div>;
    }
  };
});

describe("Blog Detail Route", () => {
  it("renders the post title as an h1 heading", () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "Test Blog Title" })
    ).toBeDefined();
  });

  it("renders the body into SanityText", () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByTestId("sanity-text").textContent).toContain(
      "Hello body"
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
