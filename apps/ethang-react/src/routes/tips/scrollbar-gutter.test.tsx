import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./scrollbar-gutter.tsx";

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

vi.mock("../../components/layout/main-layout.tsx", () => {
  return {
    MainLayout: ({ children }: { children: React.ReactNode }) => {
      return <div data-testid="main-layout">{children}</div>;
    }
  };
});

vi.mock("@radix-ui/themes", () => {
  return {
    Box: ({ children }: any) => {
      return <div>{children}</div>;
    },
    Button: ({ children, type }: any) => {
      return <button type={type ?? "button"}>{children}</button>;
    },
    Card: ({ children }: any) => {
      return <div>{children}</div>;
    },
    Code: ({ children }: any) => {
      return <div>{children}</div>;
    },
    Flex: ({ children }: any) => {
      return <div>{children}</div>;
    },
    Heading: ({ children }: any) => {
      return <div>{children}</div>;
    },
    Link: ({ children, href }: any) => {
      return <a href={href}>{children}</a>;
    },
    Section: ({ children }: any) => {
      return <div>{children}</div>;
    },
    Text: ({ children }: any) => {
      return <div>{children}</div>;
    }
  };
});

describe("Scrollbar Gutter Route", () => {
  it("renders scrollbar gutter content", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(screen.getByText("scrollbar-gutter")).toBeDefined();
  });
});
