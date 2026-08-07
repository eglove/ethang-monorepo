import { render, screen } from "@testing-library/react";
import { Array } from "effect";
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
    Badge: ({ label }: { label: string }) => {
      return <span>{label}</span>;
    },
    Button: ({ label }: { label: string }) => {
      return <button type="button">{label}</button>;
    },
    CodeBlock: ({ code }: { code?: string }) => {
      return <pre data-testid="code-block">{code ?? ""}</pre>;
    },
    Heading: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
    Icon: () => {
      return null;
    },
    MobileNav: ({ children }: { children: React.ReactNode }) => {
      return <div>{children}</div>;
    },
    SideNavSection: ({ children }: { children: React.ReactNode }) => {
      return <nav>{children}</nav>;
    },
    Text: ({ children }: { children: React.ReactNode }) => {
      return <p>{children}</p>;
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
    const [cssBlock] = codeBlocks;
    expect(cssBlock?.textContent).toContain("display: grid");
  });

  it("renders Tailwind code block", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    const codeBlocks = screen.getAllByTestId("code-block");
    expect(codeBlocks).toHaveLength(3);
    const tailwindBlock = Array.fromIterable(codeBlocks).at(-1);
    expect(tailwindBlock?.textContent).toContain("grid-rows-[auto_1fr_auto]");
  });

  it("renders demo section with scrollable content", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByLabelText("Scroll container demo")).toBeDefined();
    expect(screen.getByText("Header")).toBeDefined();
    expect(screen.getByText("Footer")).toBeDefined();
  });

  it("labels the fixed header, footer, and scrollable region clearly", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    expect(screen.getByText("Scrollable content")).toBeDefined();
    expect(screen.getByText(/fixed at the top/iu)).toBeDefined();
    expect(screen.getByText(/fixed at the bottom/iu)).toBeDefined();
  });

  it("spaces content and bounds the demo so the scrollbar appears", () => {
    // @ts-expect-error test
    const Component = Route.component;
    render(<Component />);
    const page = screen.getByTestId("tips-page");
    expect(page.className).toContain("gap-8");
    const demo = screen.getByTestId("scroll-containers-demo");
    expect(demo.className).toContain("max-w-lg");
    const region = screen.getByLabelText("Scroll container demo");
    expect(region.className).toContain("size-64");
  });
});
