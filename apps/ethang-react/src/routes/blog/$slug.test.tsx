import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./$slug.tsx";

const { mockBody, mockRouteConfig, mockSlug, mockTitle, SanityText } =
  vi.hoisted(() => {
    return {
      mockBody: [
        {
          _key: "b1",
          _type: "block",
          children: [
            { _key: "s1", _type: "span", marks: [], text: "Hello world" }
          ],
          style: "normal"
        }
      ],
      mockRouteConfig: (config: { component: React.ComponentType }) => {
        const result: { options: { component: React.ComponentType } } = {
          options: { component: config.component }
        };
        return result;
      },
      mockSlug: "test-blog-slug",
      mockTitle: "Test Blog Title",
      SanityText: ({ value }: { value: unknown }) => {
        return (
          <div data-testid="sanity-text">
            {((value as { _key: string }[])[0] as { text?: string } | undefined)
              ?.text ?? ""}
          </div>
        );
      }
    };
  });

vi.mock("@tanstack/react-query", () => {
  return {
    useQuery: vi.fn().mockReturnValue({
      data: {
        body: mockBody,
        title: mockTitle
      },
      isPending: false
    })
  };
});

vi.mock("@tanstack/react-router", () => {
  return {
    createFileRoute: () => {
      return mockRouteConfig;
    },
    useParams: () => {
      return { slug: mockSlug };
    }
  };
});

vi.mock("../../models/blog-model.ts", () => {
  return {
    getBlogBySlug: vi.fn().mockReturnValue({
      queryFn: async () => {
        return { body: mockBody, title: mockTitle };
      },
      queryKey: ["getBlogBySlug", mockSlug]
    })
  };
});

vi.mock("@radix-ui/themes", () => {
  return {
    Heading: ({ as, children }: { as?: string; children: React.ReactNode }) => {
      if ("h1" === as) {
        return <h1>{children}</h1>;
      }
      return <h2>{children}</h2>;
    }
  };
});

vi.mock("../../components/layout/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("../../components/sanity-text.tsx", () => {
  return { SanityText };
});

describe("Blog Slug Route", () => {
  it("renders blog title and body via SanityText", () => {
    const Component = Route.options.component;
    // @ts-expect-error for test
    render(<Component />);

    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(
      screen.getByRole("heading", { level: 1, name: mockTitle })
    ).toBeDefined();
    expect(screen.getByTestId("sanity-text")).toBeDefined();
  });
});
