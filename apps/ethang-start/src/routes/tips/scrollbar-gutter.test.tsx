import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./scrollbar-gutter.tsx";

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
    Text: ({ children }: { children: React.ReactNode }) => {
      return <p>{children}</p>;
    },
    CodeBlock: ({ code }: { code?: string }) => {
      return <pre data-testid="code-block">{code ?? ""}</pre>;
    },
    Button: (properties: any) => {
      return (
        <button onClick={properties.onClick} type={properties.type ?? "button"}>
          {properties.label ?? properties.children}
        </button>
      );
    },
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => {
      return <a href={href}>{children}</a>;
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

  it("renders code block with CSS", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    const codeBlock = screen.getByTestId("code-block");
    expect(codeBlock.textContent).toContain("scrollbar-gutter: stable both-edges");
  });

  it("renders external links", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByText("MDN")).toBeDefined();
    expect(screen.getByText("Spec")).toBeDefined();
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
