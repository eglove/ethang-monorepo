import { fireEvent, render, screen } from "@testing-library/react";
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
    Button: (properties: any) => {
      return (
        <button onClick={properties.onClick} type={properties.type ?? "button"}>
          {properties.children}
        </button>
      );
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

  it("toggles extra content when button is clicked", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);

    const button = screen.getByRole("button", { name: "Show Extra Content" });
    fireEvent.click(button);

    expect(screen.getByText("Hide extra content")).toBeDefined();
    const extraContent = screen.getAllByText(
      "Additional content to trigger scrollbar..."
    );
    expect(extraContent).toHaveLength(2);

    fireEvent.click(button);
    expect(screen.getByText("Show Extra Content")).toBeDefined();
  });
});
