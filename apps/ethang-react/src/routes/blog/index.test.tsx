import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { formattedDateTime, Route, selectPage } from "./index.tsx";
const mockBlogStore = {
  isPending: false,
  posts: [
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
      blogCategory: { title: "Other" },
      slug: { current: "other" },
      title: "Other Title"
    }
  ]
};

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: () => {
      return (config: { component: React.ComponentType }) => {
        return {
          component: config.component
        };
      };
    }
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
    useQuery: vi.fn().mockImplementation(() => {
      return {
        data: { posts: mockBlogStore.posts },
        isPending: mockBlogStore.isPending
      };
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
    mockBlogStore.isPending = false;
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

  it("shows spinner when data is loading", () => {
    mockBlogStore.isPending = true;
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("spinner")).toBeDefined();
  });

  it("formats dates correctly", () => {
    const result = formattedDateTime("2024-01-01T12:00:00Z");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("selects the page from the blog store", () => {
    expect(selectPage({ paginationPage: 7 })).toEqual({ page: 7 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
});
