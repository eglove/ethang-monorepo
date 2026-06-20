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

vi.mock("../../components/layout/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("@radix-ui/themes", () => {
  return {
    Flex: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
    Heading: ({ children }: { children: React.ReactNode }) => {
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

describe("Tips Index Route", () => {
  it("renders tips list", () => {
    // @ts-expect-error for test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(screen.getByText("Tips")).toBeDefined();
    expect(screen.getByText("Easy Sticky Header/Footer")).toBeDefined();
    expect(screen.getByText("scrollbar-gutter")).toBeDefined();
  });
});
