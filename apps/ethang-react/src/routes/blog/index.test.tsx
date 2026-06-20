import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./index.tsx";

const createFileRouteConfig = (config: { component: React.ComponentType }) => {
  return {
    component: config.component
  };
};

const createFileRouteMock = () => {
  return createFileRouteConfig;
};

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: createFileRouteMock
  };
});

vi.mock("@ethang/store/use-store", () => {
  return {
    useStore: vi.fn().mockReturnValue({ page: 1 })
  };
});

vi.mock("@tanstack/react-query", () => {
  return {
    keepPreviousData: {},
    useQuery: vi.fn().mockReturnValue({
      data: {
        posts: [
          {
            _id: "1",
            _updatedAt: "2024-01-01T12:00:00Z",
            blogCategory: { title: "Blog" },
            slug: { current: "test-blog" },
            title: "Test Blog Title"
          }
        ]
      },
      isPending: false
    })
  };
});

vi.mock("../../components/layout/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("@radix-ui/themes", () => {
  return {
    Card: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
    Heading: ({ as, children }: { as?: string; children: React.ReactNode }) => {
      const Tag = "h1" === as ? "h1" : "h2";
      return <Tag>{children}</Tag>;
    },
    Spinner: () => {
      return <div data-testid="spinner">Spinner</div>;
    },
    Text: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    }
  };
});

vi.mock("../../components/internal-link.tsx", () => {
  return {
    InternalLink: ({
      children,
      href
    }: {
      children: React.ReactNode;
      href: string;
    }) => {
      return <a href={href}>{children}</a>;
    }
  };
});

vi.mock("../../components/blog/blog-pagination.tsx", () => {
  return {
    BlogPagination: () => {
      return <div data-testid="pagination">Pagination</div>;
    }
  };
});

vi.mock("../../models/blog-model.ts", () => {
  return {
    getPaginatedBlogs: vi.fn()
  };
});

describe("Blog Index Route", () => {
  it("renders blog list", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: "Blog" })
    ).toBeDefined();
    expect(screen.getByText("Test Blog Title")).toBeDefined();
    expect(screen.getByTestId("pagination")).toBeDefined();
  });
});
