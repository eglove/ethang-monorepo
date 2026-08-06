import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./index.tsx";

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

vi.mock("../../components/layouts/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("@astryxdesign/core", () => {
  return {
    Heading: ({ children }: { children: React.ReactNode }) => {
      return <h1>{children}</h1>;
    },
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    }
  };
});

describe("Tips Index Route", () => {
  it("renders tips list with all links", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(screen.getByText("Tips")).toBeDefined();
    expect(screen.getByText("Easy Sticky Header/Footer")).toBeDefined();
    expect(screen.getByText("scrollbar-gutter")).toBeDefined();
  });

  it("renders links with correct hrefs", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/tips/scroll-containers");
    expect(links[1].getAttribute("href")).toBe("/tips/scrollbar-gutter");
  });
});
