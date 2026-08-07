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
    Button: ({ label }: { label: string }) => {
      return <button type="button">{label}</button>;
    },
    Heading: ({ children }: { children: React.ReactNode }) => {
      return <h1>{children}</h1>;
    },
    Icon: () => {
      return null;
    },
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
    },
    MobileNav: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
    SideNavSection: ({ children }: { children: React.ReactNode }) => {
      return <nav>{children}</nav>;
    },
    TopNav: () => {
      return null;
    },
    TopNavHeading: () => {
      return null;
    },
    TopNavItem: ({ label }: { label: string }) => {
      return <span>{label}</span>;
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
    const [firstLink, secondLink] = links;
    expect(firstLink?.getAttribute("href")).toBe("/tips/scroll-containers");
    expect(secondLink?.getAttribute("href")).toBe("/tips/scrollbar-gutter");
  });
});
