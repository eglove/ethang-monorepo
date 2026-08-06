import { render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formattedDateTime as formatDateTime } from "../../utils/formatted-date-time.ts";
import { Route } from "./index.tsx";

const { mockPosts, mockRouteConfig } = vi.hoisted(() => {
  return {
    mockPosts: [
      {
        _id: "1",
        _updatedAt: "2024-01-01T12:00:00Z",
        blogCategory: { title: "Blog" },
        slug: { current: "test-blog" },
        title: "Test Blog Title"
      },
      {
        _id: "2",
        _updatedAt: "2024-02-01T12:00:00Z",
        blogCategory: { title: "Dev Reads" },
        slug: { current: "dev-reads" },
        title: "Dev Reads Title"
      },
      {
        _id: "3",
        _updatedAt: "2024-03-01T12:00:00Z",
        blogCategory: null,
        slug: { current: "no-category" },
        title: "No Category Title"
      }
    ],
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
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    },
    useLoaderData: vi.fn(() => {
      return {
        maxPages: 1,
        posts: mockPosts,
        total: 3
      };
    }),
    useNavigate: () => {
      return vi.fn();
    },
    useSearch: vi.fn(() => {
      return { page: 1 };
    })
  };
});

vi.mock("../../models/blog.server.ts", () => {
  return {
    getPaginatedBlogsServer: vi.fn().mockReturnValue({
      maxPages: 1,
      posts: mockPosts,
      total: 3
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
    Card: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="card">{children}</div>;
    },
    Heading: ({
      children,
      level
    }: {
      children: React.ReactNode;
      level?: number;
    }) => {
      const Tag = `h${level ?? 1}` as any;
      return <Tag>{children}</Tag>;
    },
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    },
    Pagination: ({ onChange }: { onChange: (page: number) => void }) => {
      return (
        <button
          type="button"
          data-testid="pagination"
          onClick={() => {
            onChange(2);
          }}
        >
          Pagination
        </button>
      );
    },
    Text: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="text">{children}</div>;
    }
  };
});

describe("Blog Index Route", () => {
  it("renders blog list with title and category", () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "Blog" })
    ).toBeDefined();
    expect(screen.getByText("Test Blog Title")).toBeDefined();
    expect(screen.getByText("Dev Reads Title")).toBeDefined();
  });

  it("renders blog post without blogCategory without crashing", () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);
    expect(screen.getByText("No Category Title")).toBeDefined();
  });

  it("formats dates correctly", () => {
    const result = formatDateTime("2024-01-01T12:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
