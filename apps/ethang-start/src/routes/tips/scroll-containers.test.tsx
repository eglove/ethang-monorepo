import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Route } from "./scroll-containers.tsx";

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
      return <div>{children}</div>;
    },
    Text: ({ children }: { children: React.ReactNode }) => {
      return <p>{children}</p>;
    },
    CodeBlock: ({ code }: { code?: string }) => {
      return <pre data-testid="code-block">{code ?? ""}</pre>;
    }
  };
});

describe("Scroll Containers Route", () => {
  it("renders scroll containers content", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByTestId("main-layout")).toBeDefined();
    expect(screen.getByText("Easy Sticky Header/Footer")).toBeDefined();
  });

  it("renders CSS and HTML code blocks", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    const codeBlocks = screen.getAllByTestId("code-block");
    expect(codeBlocks).toHaveLength(3);
    expect(codeBlocks[0].textContent).toContain("display: grid");
  });

  it("renders Tailwind code block", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    const codeBlocks = screen.getAllByTestId("code-block");
    expect(codeBlocks[2].textContent).toContain("grid-rows-[auto_1fr_auto]");
  });

  it("renders demo section with scrollable content", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByLabelText("Scroll container demo")).toBeDefined();
    expect(screen.getByText("Header")).toBeDefined();
    expect(screen.getByText("Footer")).toBeDefined();
  });
});
